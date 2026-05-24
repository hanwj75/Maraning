import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

type UnlinkParams = {
  userKey?: string | number
  referrer?: string
}

function referrerToStatus(referrer: string | undefined): string {
  if (referrer === 'WITHDRAWAL_TERMS' || referrer === 'WITHDRAWAL_TOSS') {
    return 'withdrawn'
  }
  return 'unlinked'
}

async function handleUnlink(userKey: string | number, referrer: string | undefined) {
  const supabase = getSupabaseAdmin()

  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id, login_status')
    .eq('toss_user_key', String(userKey))
    .maybeSingle()

  if (userError) {
    throw new Error(`Failed to query user: ${userError.message}`)
  }

  if (!user) {
    return { found: false }
  }

  const newStatus = referrerToStatus(referrer)

  await supabase
    .from('app_users')
    .update({ login_status: newStatus })
    .eq('id', (user as { id: string; login_status: string }).id)

  await supabase
    .from('toss_oauth_tokens')
    .update({ access_token: null, refresh_token: null })
    .eq('user_id', (user as { id: string; login_status: string }).id)

  await supabase.from('auth_audit_logs').insert({
    user_id: (user as { id: string; login_status: string }).id,
    event: referrer === 'WITHDRAWAL_TERMS' || referrer === 'WITHDRAWAL_TOSS'
      ? 'user_withdrawal'
      : 'user_unlinked',
    referrer: referrer ?? null,
    metadata: {
      previous_status: (user as { id: string; login_status: string }).login_status,
      new_status: newStatus,
    },
  })

  return { found: true, newStatus }
}

function verifyBasicAuth(request: Request): boolean {
  const expectedHeader = Deno.env.get('TOSS_UNLINK_CALLBACK_AUTH')
  if (!expectedHeader) {
    console.warn('[toss-unlink-callback] TOSS_UNLINK_CALLBACK_AUTH secret not set — skipping auth check')
    return true
  }
  const authHeader = request.headers.get('authorization')
  return authHeader === expectedHeader
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  if (!verifyBasicAuth(request)) {
    console.warn('[toss-unlink-callback] Basic Auth verification failed')
    return jsonError('Unauthorized', { status: 401, code: 'unauthorized' })
  }

  try {
    let params: UnlinkParams = {}

    if (request.method === 'GET') {
      const url = new URL(request.url)
      params = {
        userKey: url.searchParams.get('userKey') ?? undefined,
        referrer: url.searchParams.get('referrer') ?? undefined,
      }
    } else if (request.method === 'POST') {
      params = (await request.json()) as UnlinkParams
    } else {
      return jsonError('Method not allowed', { status: 405, code: 'method_not_allowed' })
    }

    if (!params.userKey) {
      return jsonError('userKey is required', { status: 400, code: 'invalid_user_key' })
    }

    console.log(`[toss-unlink-callback] referrer=${params.referrer ?? 'none'} userKey prefix=${String(params.userKey).slice(0, 4)}`)

    const result = await handleUnlink(params.userKey, params.referrer)

    console.log(`[toss-unlink-callback] found=${result.found} newStatus=${result.found ? result.newStatus : 'n/a'}`)

    return jsonSuccess({ unlinked: true, found: result.found })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[toss-unlink-callback] ERROR: ${message}`)
    return jsonError('unlink 처리 중 오류가 발생했어요.', {
      status: 500,
      code: 'unlink_internal_error',
      details: { message },
    })
  }
})
