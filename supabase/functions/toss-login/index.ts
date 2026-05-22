import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { createAppSession } from '../_shared/session.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { generateToken, loginMe } from '../_shared/tossClient.ts'

type TossLoginRequest = {
  authorizationCode?: string
  referrer?: string
}

type AppUserRow = {
  id: string
  toss_user_key: number
  nickname: string
}

type WalletRow = {
  user_id: string
  jelly: number
}

const DEFAULT_NICKNAME = '말랑이 친구'
const DEFAULT_JELLY = 20
const DEFAULT_DIFFICULTIES = [
  'absolute_beginner',
  'beginner',
  'intermediate',
  'advanced',
  'conversation',
  'toeic',
] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function buildDefaultProgressRows(userId: string) {
  return DEFAULT_DIFFICULTIES.map((difficulty) => {
    const firstChapterId = `${difficulty}_chapter_001`
    const firstStageId = `${difficulty}_chapter_001_stage_001`

    return {
      user_id: userId,
      difficulty,
      unlocked_chapter_ids: [firstChapterId],
      completed_chapter_ids: [],
      unlocked_stage_ids_by_chapter: {
        [firstChapterId]: [firstStageId],
      },
      completed_stage_ids_by_chapter: {},
      current_chapter_id: firstChapterId,
      current_stage_id: firstStageId,
    }
  })
}

async function upsertAppUser(tossUserKey: number): Promise<AppUserRow> {
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('app_users')
    .upsert(
      {
        toss_user_key: tossUserKey,
        nickname: DEFAULT_NICKNAME,
        login_status: 'active',
        last_login_at: now,
      },
      {
        onConflict: 'toss_user_key',
      },
    )
    .select('id, toss_user_key, nickname')
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to upsert app user: ${error?.message ?? 'unknown error'}`,
    )
  }

  return data as AppUserRow
}

async function upsertTossOAuthTokens(params: {
  userId: string
  accessToken: string
  refreshToken: string
  scope: string
  referrer: string
  expiresIn: number
}) {
  const supabase = getSupabaseAdmin()
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString()
  const refreshExpiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { data: existingToken, error: selectError } = await supabase
    .from('toss_oauth_tokens')
    .select('id')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to query oauth token row: ${selectError.message}`)
  }

  if (existingToken?.id) {
    const { error: updateError } = await supabase
      .from('toss_oauth_tokens')
      .update({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        scope: params.scope,
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        referrer: params.referrer,
      })
      .eq('id', existingToken.id)

    if (updateError) {
      throw new Error(
        `Failed to update oauth token row: ${updateError.message}`,
      )
    }

    return
  }

  const { error: insertError } = await supabase
    .from('toss_oauth_tokens')
    .insert({
      user_id: params.userId,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      scope: params.scope,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt,
      referrer: params.referrer,
    })

  if (insertError) {
    throw new Error(`Failed to insert oauth token row: ${insertError.message}`)
  }
}

async function ensureWallet(userId: string): Promise<WalletRow> {
  const supabase = getSupabaseAdmin()

  const { data: existingWallet, error: walletSelectError } = await supabase
    .from('user_wallets')
    .select('user_id, jelly')
    .eq('user_id', userId)
    .maybeSingle()

  if (walletSelectError) {
    throw new Error(`Failed to query wallet row: ${walletSelectError.message}`)
  }

  if (existingWallet) {
    return existingWallet as WalletRow
  }

  const { data: insertedWallet, error: walletInsertError } = await supabase
    .from('user_wallets')
    .insert({
      user_id: userId,
      jelly: DEFAULT_JELLY,
    })
    .select('user_id, jelly')
    .single()

  if (walletInsertError || !insertedWallet) {
    throw new Error(
      `Failed to create wallet row: ${walletInsertError?.message ?? 'unknown error'}`,
    )
  }

  return insertedWallet as WalletRow
}

async function ensureDefaultProgress(userId: string) {
  const supabase = getSupabaseAdmin()

  const { count, error: countError } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw new Error(`Failed to count progress rows: ${countError.message}`)
  }

  if ((count ?? 0) > 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('user_progress')
    .insert(buildDefaultProgressRows(userId))

  if (insertError) {
    throw new Error(
      `Failed to create default progress rows: ${insertError.message}`,
    )
  }
}

function isValidTossUserKey(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

async function insertAuthAuditLog(params: {
  userId: string | null
  event: string
  referrer?: string | null
  metadata?: Record<string, unknown>
}) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('auth_audit_logs').insert({
    user_id: params.userId,
    event: params.event,
    referrer: params.referrer ?? null,
    metadata: params.metadata ?? {},
  })

  if (error) {
    throw new Error(`Failed to insert auth audit log: ${error.message}`)
  }
}

async function insertAuthAuditLogSafely(params: {
  userId: string | null
  event: string
  referrer?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    await insertAuthAuditLog(params)
  } catch {
    // audit log failure should not override the original request outcome
  }
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  if (request.method !== 'POST') {
    return jsonError('Method not allowed', {
      status: 405,
      code: 'method_not_allowed',
    })
  }

  let body: TossLoginRequest

  try {
    body = (await request.json()) as TossLoginRequest
  } catch {
    return jsonError('Invalid JSON body', {
      status: 400,
      code: 'invalid_json',
    })
  }

  if (!isNonEmptyString(body.authorizationCode)) {
    return jsonError('authorizationCode is required', {
      status: 400,
      code: 'invalid_authorization_code',
    })
  }

  if (!isNonEmptyString(body.referrer)) {
    return jsonError('referrer is required', {
      status: 400,
      code: 'invalid_referrer',
    })
  }

  try {
    const tokenResult = await generateToken(
      body.authorizationCode.trim(),
      body.referrer.trim(),
    )
    const loginResult = await loginMe(tokenResult.accessToken)

    if (!isValidTossUserKey(loginResult.userKey)) {
      await insertAuthAuditLogSafely({
        userId: null,
        event: 'toss_login_failed',
        referrer: body.referrer.trim(),
        metadata: {
          reason: 'missing_user_key',
        },
      })

      return jsonError('Toss login response missing userKey', {
        status: 400,
        code: 'missing_user_key',
      })
    }

    const appUser = await upsertAppUser(loginResult.userKey)

    await upsertTossOAuthTokens({
      userId: appUser.id,
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      scope: loginResult.scope || tokenResult.scope,
      referrer: body.referrer.trim(),
      expiresIn: tokenResult.expiresIn,
    })

    const wallet = await ensureWallet(appUser.id)
    await ensureDefaultProgress(appUser.id)

    await insertAuthAuditLog({
      userId: appUser.id,
      event: 'toss_login_success',
      referrer: body.referrer.trim(),
      metadata: {
        scope: loginResult.scope || tokenResult.scope,
        agreedTerms: loginResult.agreedTerms ?? [],
      },
    })

    const sessionToken = await createAppSession(
      appUser.id,
      appUser.toss_user_key,
    )

    return jsonSuccess({
      sessionToken,
      user: {
        id: appUser.id,
        tossUserKey: appUser.toss_user_key,
        nickname: appUser.nickname,
      },
      wallet: {
        jelly: wallet.jelly,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('invalid_grant')) {
      await insertAuthAuditLogSafely({
        userId: null,
        event: 'toss_login_failed',
        referrer: body.referrer?.trim() ?? null,
        metadata: {
          reason: 'invalid_grant',
          message,
        },
      })

      return jsonError('Invalid authorization grant', {
        status: 400,
        code: 'invalid_grant',
      })
    }

    if (message.includes('Toss API')) {
      await insertAuthAuditLogSafely({
        userId: null,
        event: 'toss_login_failed',
        referrer: body.referrer?.trim() ?? null,
        metadata: {
          reason: 'toss_api_error',
          message,
        },
      })

      return jsonError('Failed to communicate with Toss API', {
        status: 502,
        code: 'toss_api_error',
        details: { message },
      })
    }

    await insertAuthAuditLogSafely({
      userId: null,
      event: 'toss_login_failed',
      referrer: body.referrer?.trim() ?? null,
      metadata: {
        reason: 'internal_error',
        message,
      },
    })

    return jsonError('Failed to complete toss login', {
      status: 500,
      code: 'toss_login_failed',
      details: { message },
    })
  }
})
