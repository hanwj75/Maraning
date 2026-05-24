import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { verifyActiveAppSession } from '../_shared/session.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

type AdRewardRequest = {
  adEventId?: string
  adUnitId?: string
}

type WalletGrantRow = {
  user_id: string
  jelly: number
  updated_at: string
  granted?: boolean
  duplicate?: boolean
}

const DAILY_REWARD_LIMIT = 10
const REWARD_COOLDOWN_SECONDS = 20
const AD_REWARD_AMOUNT = 5

async function getAuthenticatedUserId(request: Request) {
  const session = await verifyActiveAppSession(request.headers.get('authorization'))
  return session.sub
}

async function hasDuplicateReward(userId: string, adEventId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('ad_reward_events')
    .select('id')
    .eq('user_id', userId)
    .eq('ad_event_id', adEventId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query ad reward event: ${error.message}`)
  }

  return Boolean(data)
}

async function getTodayRewardCount(userId: string) {
  const supabase = getSupabaseAdmin()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('ad_reward_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())
    .eq('status', 'granted')

  if (error) {
    throw new Error(`Failed to count ad reward events: ${error.message}`)
  }

  return count ?? 0
}

async function isInCooldown(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('ad_reward_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('status', 'granted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to query ad reward cooldown: ${error.message}`)
  }

  if (!data?.created_at) {
    return false
  }

  const lastCreatedAt = new Date(data.created_at).getTime()
  const now = Date.now()

  return now - lastCreatedAt < REWARD_COOLDOWN_SECONDS * 1000
}

async function insertAdRewardEvent(params: {
  userId: string
  adEventId: string
  status: string
  rewardAmount?: number
}) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('ad_reward_events').upsert(
    {
      user_id: params.userId,
      ad_event_id: params.adEventId,
      status: params.status,
      reward_amount: params.rewardAmount ?? AD_REWARD_AMOUNT,
    },
    { onConflict: 'user_id,ad_event_id', ignoreDuplicates: true },
  )

  if (error) {
    throw new Error(`Failed to insert ad reward event: ${error.message}`)
  }
}

async function grantReward(params: {
  userId: string
  adEventId: string
  adUnitId?: string
}) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .rpc('grant_wallet_jelly', {
      p_user_id: params.userId,
      p_amount: AD_REWARD_AMOUNT,
      p_reason: 'ad_reward',
      p_source_id: `ad_reward:${params.adEventId}`,
      p_metadata: {
        wallet_action: 'ad_reward',
        ad_event_id: params.adEventId,
        ad_unit_id: params.adUnitId ?? null,
      },
    })
    .single()

  if (error || !data) {
    throw new Error(`Failed to grant ad reward: ${error?.message ?? 'unknown error'}`)
  }

  return data as WalletGrantRow
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  const url = new URL(request.url)

  if (request.method !== 'POST' || !url.pathname.endsWith('/complete')) {
    return jsonError('Not found', {
      status: 404,
      code: 'not_found',
    })
  }

  try {
    const userId = await getAuthenticatedUserId(request)
    const body = (await request.json()) as AdRewardRequest

    if (typeof body.adEventId !== 'string' || body.adEventId.trim().length === 0) {
      return jsonError('adEventId is required', {
        status: 400,
        code: 'invalid_ad_event_id',
      })
    }

    const adEventId = body.adEventId.trim()
    const adUnitId =
      typeof body.adUnitId === 'string' && body.adUnitId.trim().length > 0
        ? body.adUnitId.trim()
        : undefined

    if (await hasDuplicateReward(userId, adEventId)) {
      return jsonError('이미 처리된 광고 보상이에요.', {
        status: 409,
        code: 'duplicate_ad_event',
      })
    }

    const todayRewardCount = await getTodayRewardCount(userId)
    if (todayRewardCount >= DAILY_REWARD_LIMIT) {
      await insertAdRewardEvent({
        userId,
        adEventId,
        status: 'daily_limit_rejected',
        rewardAmount: 0,
      })

      return jsonError('오늘 받을 수 있는 광고 보상을 모두 받았어요.', {
        status: 429,
        code: 'daily_limit_exceeded',
      })
    }

    if (await isInCooldown(userId)) {
      await insertAdRewardEvent({
        userId,
        adEventId,
        status: 'cooldown_rejected',
        rewardAmount: 0,
      })

      return jsonError('광고 보상은 잠시 후 다시 시도해 주세요.', {
        status: 429,
        code: 'reward_cooldown_active',
      })
    }

    const grantedWallet = await grantReward({
      userId,
      adEventId,
      adUnitId,
    })

    await insertAdRewardEvent({
      userId,
      adEventId,
      status: grantedWallet.duplicate ? 'duplicate' : 'granted',
      rewardAmount: grantedWallet.granted === false ? 0 : AD_REWARD_AMOUNT,
    })

    if (grantedWallet.duplicate) {
      return jsonError('이미 처리된 광고 보상이에요.', {
        status: 409,
        code: 'duplicate_ad_event',
      })
    }

    return jsonSuccess({
      wallet: {
        jelly: grantedWallet.jelly,
        updatedAt: grantedWallet.updated_at,
      },
      rewardAmount: AD_REWARD_AMOUNT,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown ad reward function error'

    if (
      message.includes('SESSION_REVOKED') ||
      message.includes('Authorization') ||
      message.includes('session token') ||
      message.includes('signature')
    ) {
      const isRevoked = message.includes('SESSION_REVOKED')
      return jsonError(
        isRevoked ? '로그인 연결이 해제되었습니다. 다시 로그인해 주세요.' : '인증이 필요해요.',
        {
          status: 401,
          code: isRevoked ? 'session_revoked' : 'unauthorized',
        },
      )
    }

    return jsonError('광고 보상 처리 중 오류가 발생했어요.', {
      status: 500,
      code: 'ad_reward_internal_error',
      details: {
        message,
        note: 'IntegratedAd success payload verification can be added later.',
      },
    })
  }
})
