import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { createAppSession } from '../_shared/session.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { generateToken, loginMe } from '../_shared/tossClient.ts'
import type { TossLoginMeResponse, TossTokenResponse } from '../_shared/tossClient.ts'

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

type ProgressSummary = {
  currentChapterId: string
  currentStageId: string
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

function isValidTossUserKey(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function getMissingRequiredEnvs(): string[] {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'APP_SESSION_JWT_SECRET',
    'TOSS_CLIENT_CERT',
    'TOSS_CLIENT_KEY',
  ]
  return required.filter((k) => !Deno.env.get(k))
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

async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  const supabase = getSupabaseAdmin()
  const primaryDifficulty = DEFAULT_DIFFICULTIES[0]

  const { data, error } = await supabase
    .from('user_progress')
    .select('current_chapter_id, current_stage_id')
    .eq('user_id', userId)
    .eq('difficulty', primaryDifficulty)
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to fetch progress summary: ${error?.message ?? 'unknown error'}`,
    )
  }

  return {
    currentChapterId:
      data.current_chapter_id ?? `${primaryDifficulty}_chapter_001`,
    currentStageId:
      data.current_stage_id ?? `${primaryDifficulty}_chapter_001_stage_001`,
  }
}

async function insertAuthAuditLogSafely(params: {
  userId: string | null
  event: string
  referrer?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = getSupabaseAdmin()
    await supabase.from('auth_audit_logs').insert({
      user_id: params.userId,
      event: params.event,
      referrer: params.referrer ?? null,
      metadata: params.metadata ?? {},
    })
  } catch {
    // audit log failure should not override the original request outcome
  }
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  console.log('[toss-login] request received, method:', request.method)

  if (request.method !== 'POST') {
    return jsonError('Method not allowed', {
      status: 405,
      code: 'method_not_allowed',
    })
  }

  // Env check
  const missingEnvs = getMissingRequiredEnvs()
  if (missingEnvs.length > 0) {
    console.error('[toss-login] MISSING_ENV:', missingEnvs.join(', '))
    return jsonError(`Missing required env: ${missingEnvs.join(', ')}`, {
      status: 500,
      code: 'MISSING_ENV',
    })
  }
  console.log('[toss-login] env: ok')

  // Body parse
  let body: TossLoginRequest
  try {
    body = (await request.json()) as TossLoginRequest
    console.log('[toss-login] body parsed, authCode exists:', isNonEmptyString(body.authorizationCode), 'referrer:', body.referrer ?? '(none)')
  } catch {
    return jsonError('Invalid JSON body', {
      status: 400,
      code: 'invalid_json',
    })
  }

  if (!isNonEmptyString(body.authorizationCode)) {
    return jsonError('authorizationCode is required', {
      status: 400,
      code: 'INVALID_AUTHORIZATION_CODE',
    })
  }

  if (!isNonEmptyString(body.referrer)) {
    return jsonError('referrer is required', {
      status: 400,
      code: 'invalid_referrer',
    })
  }

  const authCode = body.authorizationCode.trim()
  const referrer = body.referrer.trim()

  // Step 1: generate-token
  let tokenResult!: TossTokenResponse
  try {
    console.log('[toss-login] generate-token: start')
    tokenResult = await generateToken(authCode, referrer)
    console.log('[toss-login] generate-token: success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] generate-token: failed:', message)
    await insertAuthAuditLogSafely({
      userId: null,
      event: 'toss_login_failed',
      referrer,
      metadata: { reason: 'generate_token_failed', message },
    })
    if (message.includes('invalid_grant')) {
      return jsonError('인증 코드가 만료되었어요. 다시 로그인해 주세요.', {
        status: 400,
        code: 'INVALID_AUTHORIZATION_CODE',
      })
    }
    return jsonError('토스 토큰 발급에 실패했어요.', {
      status: 502,
      code: 'TOSS_GENERATE_TOKEN_FAILED',
      details: { step: 'generate-token' },
    })
  }

  // Step 2: login-me
  let loginResult!: TossLoginMeResponse
  try {
    console.log('[toss-login] login-me: start')
    loginResult = await loginMe(tokenResult.accessToken)
    console.log('[toss-login] login-me: success, userKey exists:', isValidTossUserKey(loginResult.userKey))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] login-me: failed:', message)
    await insertAuthAuditLogSafely({
      userId: null,
      event: 'toss_login_failed',
      referrer,
      metadata: { reason: 'login_me_failed', message },
    })
    return jsonError('토스 사용자 정보 조회에 실패했어요.', {
      status: 502,
      code: 'TOSS_LOGIN_ME_FAILED',
      details: { step: 'login-me' },
    })
  }

  if (!isValidTossUserKey(loginResult.userKey)) {
    console.error('[toss-login] missing userKey in login-me response')
    await insertAuthAuditLogSafely({
      userId: null,
      event: 'toss_login_failed',
      referrer,
      metadata: { reason: 'missing_user_key' },
    })
    return jsonError('토스 사용자 키가 없어요.', {
      status: 400,
      code: 'MISSING_USER_KEY',
    })
  }

  // Step 3: upsert app_users
  let appUser!: AppUserRow
  try {
    console.log('[toss-login] app_users upsert: start')
    appUser = await upsertAppUser(loginResult.userKey)
    console.log('[toss-login] app_users upsert: success, userId:', appUser.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] app_users upsert: failed:', message)
    await insertAuthAuditLogSafely({
      userId: null,
      event: 'toss_login_failed',
      referrer,
      metadata: { reason: 'db_user_upsert_failed', message },
    })
    return jsonError('사용자 정보 저장에 실패했어요.', {
      status: 500,
      code: 'DB_USER_UPSERT_FAILED',
    })
  }

  // Step 4: upsert toss_oauth_tokens (non-fatal)
  try {
    console.log('[toss-login] toss_oauth_tokens upsert: start')
    await upsertTossOAuthTokens({
      userId: appUser.id,
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      scope: loginResult.scope || tokenResult.scope,
      referrer,
      expiresIn: tokenResult.expiresIn,
    })
    console.log('[toss-login] toss_oauth_tokens upsert: success')
  } catch (error) {
    console.error('[toss-login] toss_oauth_tokens upsert: failed (non-fatal):', error instanceof Error ? error.message : 'unknown')
    // non-fatal — continue
  }

  // Step 5: ensure user_wallets
  let wallet!: WalletRow
  try {
    console.log('[toss-login] user_wallets ensure: start')
    wallet = await ensureWallet(appUser.id)
    console.log('[toss-login] user_wallets ensure: success, jelly:', wallet.jelly)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] user_wallets ensure: failed:', message)
    await insertAuthAuditLogSafely({
      userId: appUser.id,
      event: 'toss_login_failed',
      referrer,
      metadata: { reason: 'db_wallet_init_failed', message },
    })
    return jsonError('지갑 초기화에 실패했어요.', {
      status: 500,
      code: 'DB_WALLET_INIT_FAILED',
    })
  }

  // Step 6: ensure user_progress
  try {
    console.log('[toss-login] user_progress ensure: start')
    await ensureDefaultProgress(appUser.id)
    console.log('[toss-login] user_progress ensure: success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] user_progress ensure: failed:', message)
    await insertAuthAuditLogSafely({
      userId: appUser.id,
      event: 'toss_login_failed',
      referrer,
      metadata: { reason: 'db_progress_init_failed', message },
    })
    return jsonError('진행도 초기화에 실패했어요.', {
      status: 500,
      code: 'DB_PROGRESS_INIT_FAILED',
    })
  }

  // Step 7: fetch progress summary
  let progressSummary!: ProgressSummary
  try {
    console.log('[toss-login] progress summary: start')
    progressSummary = await getProgressSummary(appUser.id)
    console.log('[toss-login] progress summary: success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] progress summary: failed:', message)
    return jsonError('진행도 조회에 실패했어요.', {
      status: 500,
      code: 'DB_PROGRESS_FETCH_FAILED',
    })
  }

  // Audit log: success (non-fatal)
  await insertAuthAuditLogSafely({
    userId: appUser.id,
    event: 'toss_login_success',
    referrer,
    metadata: {
      scope: loginResult.scope || tokenResult.scope,
      agreedTerms: loginResult.agreedTerms ?? [],
    },
  })

  // Step 8: create session
  let sessionToken!: string
  try {
    console.log('[toss-login] createAppSession: start')
    sessionToken = await createAppSession(appUser.id, appUser.toss_user_key)
    console.log('[toss-login] createAppSession: success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error('[toss-login] createAppSession: failed:', message)
    return jsonError('세션 생성에 실패했어요.', {
      status: 500,
      code: 'SESSION_CREATE_FAILED',
    })
  }

  console.log('[toss-login] response: success')
  return jsonSuccess({
    sessionToken,
    user: {
      id: appUser.id,
      nickname: appUser.nickname,
    },
    wallet: {
      jelly: wallet.jelly,
    },
    progress: progressSummary,
  })
})
