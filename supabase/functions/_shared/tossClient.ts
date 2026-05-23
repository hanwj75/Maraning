import { env } from './env.ts'

type TossSuccessEnvelope<T> = {
  resultType: 'SUCCESS'
  success: T
}

type TossFailEnvelope = {
  resultType?: 'FAIL'
  error?: {
    errorCode?: string
    reason?: string
  }
}

export type TossTokenResponse = {
  tokenType: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string
}

export type TossLoginMeResponse = {
  userKey: number
  scope: string
  agreedTerms: string[]
  name?: string | null
  phone?: string | null
  birthday?: string | null
  ci?: string | null
  di?: string | null
  gender?: string | null
  nationality?: string | null
  email?: string | null
}

type TossRevokeResponse = {
  userKey: number
}

async function parseTossResponse<T>(response: Response): Promise<T> {
  let payload:
    | TossSuccessEnvelope<T>
    | TossFailEnvelope
    | { error?: string }

  try {
    payload = (await response.json()) as
      | TossSuccessEnvelope<T>
      | TossFailEnvelope
      | { error?: string }
  } catch {
    throw new Error(
      `Toss API error: invalid_json_response ${response.status} ${response.statusText}`.trim(),
    )
  }

  if ('error' in payload && typeof payload.error === 'string') {
    throw new Error(`Toss API error: ${payload.error}`)
  }

  if ('resultType' in payload && payload.resultType === 'SUCCESS') {
    return payload.success
  }

  if (
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object'
  ) {
    throw new Error(
      `Toss API error: ${payload.error.errorCode ?? 'unknown'} ${payload.error.reason ?? ''}`.trim(),
    )
  }

  if (!response.ok) {
    throw new Error(
      `Toss API request failed: ${response.status} ${response.statusText}`,
    )
  }

  throw new Error('Toss API error: unknown response')
}

function normalizePem(pem: string): string {
  if (pem.includes('\n')) return pem.replace(/\r\n/g, '\n')
  if (pem.includes('\\n')) return pem.replace(/\\n/g, '\n')
  // Supabase Secrets stripped all newlines — reconstruct PEM from single-line value
  const match = pem.match(/^(-----BEGIN [^-]+-----)([\s\S]*?)(-----END [^-]+-----)$/)
  if (!match) return pem
  const body = match[2].replace(/\s+/g, '')
  const lines = body.match(/.{1,64}/g) ?? []
  return `${match[1]}\n${lines.join('\n')}\n${match[3]}\n`
}

function buildTossRequestInit(init: RequestInit): RequestInit {
  const base: RequestInit & { client?: unknown } = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  }

  if (env.tossClientCert && env.tossClientKey) {
    // deno-specific: mTLS client certificate for apps-in-toss-api.toss.im
    const cert = normalizePem(env.tossClientCert)
    const key = normalizePem(env.tossClientKey)
    // @ts-ignore
    base.client = Deno.createHttpClient({ cert, key })
  }

  return base
}

async function tossRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(
    `${env.tossApiBaseUrl}${path}`,
    buildTossRequestInit(init),
  )

  return parseTossResponse<T>(response)
}

export function generateToken(authorizationCode: string, referrer: string) {
  return tossRequest<TossTokenResponse>(
    '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
    {
      method: 'POST',
      body: JSON.stringify({ authorizationCode, referrer }),
    },
  )
}

export function refreshToken(refreshTokenValue: string) {
  return tossRequest<TossTokenResponse>(
    '/api-partner/v1/apps-in-toss/user/oauth2/refresh-token',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    },
  )
}

export function loginMe(accessToken: string) {
  return tossRequest<TossLoginMeResponse>(
    '/api-partner/v1/apps-in-toss/user/oauth2/login-me',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
}

export function revokeByAccessToken(accessToken: string) {
  return tossRequest<TossRevokeResponse>(
    '/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
}

export function revokeByUserKey(userKey: number) {
  return tossRequest<TossRevokeResponse>(
    '/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key',
    {
      method: 'POST',
      body: JSON.stringify({ userKey }),
    },
  )
}
