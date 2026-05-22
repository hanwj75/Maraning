import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { verifyAppSession } from '../_shared/session.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

type ProductId = 'jelly_10' | 'jelly_30' | 'jelly_50' | 'jelly_100'

type CreateOrderRequest = {
  productId?: string
}

type VerifyPaymentRequest = {
  provider?: 'appintos_iap' | 'tosspay'
  providerOrderId?: string
  receipt?: string
  paymentKey?: string
}

const PAYMENTS_VERIFICATION_ENABLED = false

const PRODUCT_CATALOG: Record<
  ProductId,
  { jellyAmount: number; amountKrw: number }
> = {
  jelly_10: { jellyAmount: 10, amountKrw: 1000 },
  jelly_30: { jellyAmount: 30, amountKrw: 2500 },
  jelly_50: { jellyAmount: 50, amountKrw: 3900 },
  jelly_100: { jellyAmount: 100, amountKrw: 6900 },
}

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && value in PRODUCT_CATALOG
}

async function getAuthenticatedUserId(request: Request) {
  const session = await verifyAppSession(request.headers.get('authorization'))
  return session.sub
}

function createServerOrderId() {
  return crypto.randomUUID()
}

async function createPaymentOrder(params: {
  userId: string
  productId: ProductId
}) {
  const supabase = getSupabaseAdmin()
  const product = PRODUCT_CATALOG[params.productId]
  const providerOrderId = createServerOrderId()

  const { data, error } = await supabase
    .from('payment_orders')
    .insert({
      user_id: params.userId,
      provider: 'internal_pending',
      provider_order_id: providerOrderId,
      product_id: params.productId,
      status: 'pending',
      amount_krw: product.amountKrw,
      jelly_amount: product.jellyAmount,
      raw_payload: {
        payment_flow: 'pending_created',
      },
    })
    .select(
      'id, provider, provider_order_id, product_id, status, amount_krw, jelly_amount, created_at',
    )
    .single()

  if (error || !data) {
    throw new Error(`Failed to create payment order: ${error?.message ?? 'unknown error'}`)
  }

  return data
}

async function findExistingProviderOrder(
  provider: 'appintos_iap' | 'tosspay',
  providerOrderId: string,
) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('payment_orders')
    .select('id, status')
    .eq('provider', provider)
    .eq('provider_order_id', providerOrderId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query payment order: ${error.message}`)
  }

  return data
}

async function recordVerificationAttempt(params: {
  userId: string
  provider: 'appintos_iap' | 'tosspay'
  providerOrderId: string
  rawPayload: Record<string, unknown>
}) {
  const existingOrder = await findExistingProviderOrder(
    params.provider,
    params.providerOrderId,
  )

  if (existingOrder) {
    return existingOrder
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('payment_orders')
    .insert({
      user_id: params.userId,
      provider: params.provider,
      provider_order_id: params.providerOrderId,
      product_id: 'verification_pending',
      status: 'verification_pending',
      raw_payload: params.rawPayload,
    })
    .select('id, status')
    .single()

  if (error || !data) {
    throw new Error(`Failed to record verification attempt: ${error?.message ?? 'unknown error'}`)
  }

  return data
}

async function markOrderAsVerificationDisabled(orderId: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('payment_orders')
    .update({
      status: 'verification_disabled',
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to mark payment order as verification_disabled: ${error.message}`)
  }
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  const url = new URL(request.url)

  try {
    const userId = await getAuthenticatedUserId(request)

    if (request.method === 'POST' && url.pathname.endsWith('/create-order')) {
      const body = (await request.json()) as CreateOrderRequest

      if (!isProductId(body.productId)) {
        return jsonError('지원하지 않는 productId예요.', {
          status: 400,
          code: 'invalid_product_id',
        })
      }

      const order = await createPaymentOrder({
        userId,
        productId: body.productId,
      })

      return jsonSuccess({
        order: {
          id: order.id,
          provider: order.provider,
          providerOrderId: order.provider_order_id,
          productId: order.product_id,
          status: order.status,
          amountKrw: order.amount_krw,
          jellyAmount: order.jelly_amount,
          createdAt: order.created_at,
        },
      })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/verify')) {
      const body = (await request.json()) as VerifyPaymentRequest

      if (body.provider !== 'appintos_iap' && body.provider !== 'tosspay') {
        return jsonError('지원하지 않는 provider예요.', {
          status: 400,
          code: 'invalid_provider',
        })
      }

      if (
        typeof body.providerOrderId !== 'string' ||
        body.providerOrderId.trim().length === 0
      ) {
        return jsonError('providerOrderId가 필요해요.', {
          status: 400,
          code: 'invalid_provider_order_id',
        })
      }

      const existingOrder = await recordVerificationAttempt({
        userId,
        provider: body.provider,
        providerOrderId: body.providerOrderId.trim(),
        rawPayload: {
          receiptProvided: typeof body.receipt === 'string',
          paymentKeyProvided: typeof body.paymentKey === 'string',
          verification_state: 'not_implemented',
        },
      })

      if (!PAYMENTS_VERIFICATION_ENABLED) {
        await markOrderAsVerificationDisabled(existingOrder.id)

        return jsonError('결제 검증은 아직 활성화되지 않았어요. 검증 전 젤리는 지급되지 않아요.', {
          status: 501,
          code: 'payment_verification_not_implemented',
          details: {
            orderId: existingOrder.id,
            status: 'verification_disabled',
          },
        })
      }

      return jsonError('결제 검증은 아직 활성화되지 않았어요. 검증 전 젤리는 지급되지 않아요.', {
        status: 501,
        code: 'payment_verification_not_implemented',
        details: {
          orderId: existingOrder.id,
          status: existingOrder.status,
        },
      })
    }

    return jsonError('Not found', {
      status: 404,
      code: 'not_found',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown payments function error'

    if (
      message.includes('Authorization') ||
      message.includes('session token') ||
      message.includes('signature')
    ) {
      return jsonError('인증이 필요해요.', {
        status: 401,
        code: 'unauthorized',
      })
    }

    return jsonError('payments 처리 중 오류가 발생했어요.', {
      status: 500,
      code: 'payments_internal_error',
      details: { message },
    })
  }
})
