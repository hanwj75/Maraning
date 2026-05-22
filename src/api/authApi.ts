export type TossLoginApiRequest = {
  authorizationCode: string
  referrer: string
}

export type SessionUser = {
  id: string
  tossUserKey: number
  nickname: string
}

export type SessionWallet = {
  jelly: number
}

export type TossLoginApiResponse = {
  sessionToken: string
  user: SessionUser
  wallet: SessionWallet
}

export const MOCK_SESSION_TOKEN = 'mock-session-token'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function getViteEnvValue(key: string) {
  try {
    const env = (0, eval)('import.meta.env') as Record<string, string | undefined>
    return env?.[key]
  } catch {
    return undefined
  }
}

export function getAuthApiBaseUrl() {
  const explicitApiBaseUrl = getViteEnvValue('VITE_API_BASE_URL')
  const explicitFunctionsBaseUrl =
    getViteEnvValue('VITE_SUPABASE_FUNCTIONS_URL') ??
    getViteEnvValue('VITE_SUPABASE_FUNCTIONS_BASE_URL')
  const supabaseUrl = getViteEnvValue('VITE_SUPABASE_URL')

  if (explicitApiBaseUrl) {
    return trimTrailingSlash(explicitApiBaseUrl)
  }

  if (explicitFunctionsBaseUrl) {
    return trimTrailingSlash(explicitFunctionsBaseUrl)
  }

  if (supabaseUrl) {
    return `${trimTrailingSlash(supabaseUrl)}/functions/v1`
  }

  if (isLocalDevEnvironment()) {
    return '/functions/v1'
  }

  throw new Error(
    'API 주소가 설정되지 않았어요. VITE_API_BASE_URL 또는 VITE_SUPABASE_FUNCTIONS_URL을 확인해 주세요.',
  )
}

export function isLocalDevEnvironment() {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  )
}

function createMockLoginResponse(): TossLoginApiResponse {
  return {
    sessionToken: MOCK_SESSION_TOKEN,
    user: {
      id: 'mock-user-id',
      tossUserKey: 0,
      nickname: '말랑이 친구',
    },
    wallet: {
      jelly: 20,
    },
  }
}

export async function tossLogin(
  payload: TossLoginApiRequest,
): Promise<TossLoginApiResponse> {
  const baseUrl = getAuthApiBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/toss-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = (await response.json()) as
      | {
          success: true
          data: TossLoginApiResponse
        }
      | {
          success: false
          error?: {
            message?: string
          }
        }

    if (!response.ok || !result.success) {
      throw new Error(
        result.success ? '토스 로그인에 실패했어요.' : result.error?.message || '토스 로그인에 실패했어요.',
      )
    }

    return result.data
  } catch (error) {
    if (isLocalDevEnvironment()) {
      return createMockLoginResponse()
    }

    throw error
  }
}

export function getAuthorizationHeaders(sessionToken: string | null) {
  const headers: Record<string, string> = {}

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`
  }

  return headers
}
