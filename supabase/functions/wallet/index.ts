import { env } from '../_shared/env.ts'
import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { verifyAppSession } from '../_shared/session.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

type ConsumeRequest = {
  amount?: number
  reason?: string
  sourceId?: string | null
}

type GrantRequest = {
  userId?: string
  amount?: number
  reason?: string
  sourceId?: string | null
  metadata?: Record<string, unknown>
}

type WalletRpcRow = {
  user_id: string
  jelly: number
  last_daily_refill_date?: string | null
  updated_at: string
  refilled?: boolean
  consumed?: boolean
  granted?: boolean
  duplicate?: boolean
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
}

async function getAuthenticatedUserId(request: Request) {
  const session = await verifyAppSession(request.headers.get('authorization'))
  return session.sub
}

async function syncDailyWallet(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .rpc('sync_daily_wallet_refill', {
      p_user_id: userId,
    })
    .single()

  if (error || !data) {
    throw new Error(`Failed to sync wallet: ${error?.message ?? 'unknown error'}`)
  }

  return data as WalletRpcRow
}

async function consumeWallet(params: {
  userId: string
  amount: number
  reason: string
  sourceId: string | null
}) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .rpc('consume_wallet_jelly', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_reason: params.reason,
      p_source_id: params.sourceId,
    })
    .single()

  if (error) {
    if (error.message.includes('INSUFFICIENT_JELLY')) {
      return { insufficient: true as const }
    }

    throw new Error(`Failed to consume wallet: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to consume wallet: empty response')
  }

  return { insufficient: false as const, row: data as WalletRpcRow }
}

async function grantWallet(params: {
  userId: string
  amount: number
  reason: string
  sourceId: string | null
  metadata: Record<string, unknown>
}) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .rpc('grant_wallet_jelly', {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_reason: params.reason,
      p_source_id: params.sourceId,
      p_metadata: params.metadata,
    })
    .single()

  if (error || !data) {
    throw new Error(`Failed to grant wallet: ${error?.message ?? 'unknown error'}`)
  }

  return data as WalletRpcRow
}

function isInternalGrantRequest(request: Request) {
  return request.headers.get('x-internal-service-key') === env.supabaseServiceRoleKey
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  const url = new URL(request.url)
  console.log(`[wallet] ${request.method} ${url.pathname}`)
  console.log(`[wallet] auth header present: ${request.headers.has('authorization')}`)

  try {
    if (request.method === 'GET') {
      console.log('[wallet] GET: verifying session')
      const userId = await getAuthenticatedUserId(request)
      console.log(`[wallet] GET: session ok uid=${userId.slice(0, 8)}`)
      const wallet = await syncDailyWallet(userId)

      return jsonSuccess({
        wallet: {
          jelly: wallet.jelly,
          lastDailyRefillDate: wallet.last_daily_refill_date ?? null,
          updatedAt: wallet.updated_at,
          refilledToday: wallet.refilled ?? false,
        },
      })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/consume')) {
      console.log('[wallet] POST /consume: verifying session')
      const userId = await getAuthenticatedUserId(request)
      console.log(`[wallet] POST /consume: session ok uid=${userId.slice(0, 8)}`)
      const body = (await request.json()) as ConsumeRequest
      console.log(`[wallet] POST /consume: amount=${body.amount} reason=${body.reason} sourceId=${body.sourceId ?? 'null'}`)

      if (!isPositiveInteger(body.amount)) {
        return jsonError('amount must be a positive integer', {
          status: 400,
          code: 'invalid_amount',
        })
      }

      if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
        return jsonError('reason is required', {
          status: 400,
          code: 'invalid_reason',
        })
      }

      await syncDailyWallet(userId)

      const result = await consumeWallet({
        userId,
        amount: body.amount,
        reason: body.reason.trim(),
        sourceId:
          typeof body.sourceId === 'string' && body.sourceId.trim().length > 0
            ? body.sourceId.trim()
            : null,
      })

      if (result.insufficient) {
        return jsonError('젤리가 부족해요.', {
          status: 409,
          code: 'insufficient_jelly',
        })
      }

      return jsonSuccess({
        wallet: {
          jelly: result.row.jelly,
          updatedAt: result.row.updated_at,
        },
        duplicate: result.row.duplicate ?? false,
        consumed: result.row.consumed ?? false,
      })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/grant')) {
      if (!isInternalGrantRequest(request)) {
        return jsonError('Forbidden', {
          status: 403,
          code: 'forbidden',
        })
      }

      const body = (await request.json()) as GrantRequest

      if (typeof body.userId !== 'string' || body.userId.trim().length === 0) {
        return jsonError('userId is required', {
          status: 400,
          code: 'invalid_user_id',
        })
      }

      if (!isPositiveInteger(body.amount)) {
        return jsonError('amount must be a positive integer', {
          status: 400,
          code: 'invalid_amount',
        })
      }

      if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
        return jsonError('reason is required', {
          status: 400,
          code: 'invalid_reason',
        })
      }

      const result = await grantWallet({
        userId: body.userId.trim(),
        amount: body.amount,
        reason: body.reason.trim(),
        sourceId:
          typeof body.sourceId === 'string' && body.sourceId.trim().length > 0
            ? body.sourceId.trim()
            : null,
        metadata:
          body.metadata && typeof body.metadata === 'object'
            ? body.metadata
            : {},
      })

      return jsonSuccess({
        wallet: {
          jelly: result.jelly,
          updatedAt: result.updated_at,
        },
        duplicate: result.duplicate ?? false,
        granted: result.granted ?? false,
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
        : 'Unknown wallet function error'

    console.error(`[wallet] ERROR: ${message}`)

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

    return jsonError('wallet 처리 중 오류가 발생했어요.', {
      status: 500,
      code: 'wallet_internal_error',
      details: { message },
    })
  }
})
