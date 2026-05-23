export type TossLoginApiRequest = {
  authorizationCode: string
  referrer: string
}

export type SessionUser = {
  id: string
  nickname: string
}

export type SessionWallet = {
  jelly: number
}

export type TossLoginProgressSummary = {
  currentChapterId: string
  currentStageId: string
}

export type TossLoginApiResponse = {
  sessionToken: string
  user: SessionUser
  wallet: SessionWallet
  progress?: TossLoginProgressSummary
}

export const MOCK_SESSION_TOKEN = 'mock-session-token'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function getAuthApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return trimTrailingSlash(import.meta.env.VITE_API_BASE_URL as string)
  }

  if (import.meta.env.VITE_SUPABASE_URL) {
    return `${trimTrailingSlash(import.meta.env.VITE_SUPABASE_URL as string)}/functions/v1`
  }

  if (isLocalDevEnvironment()) {
    return '/functions/v1'
  }

  throw new Error(
    'API 주소가 설정되지 않았어요. VITE_SUPABASE_URL 또는 VITE_API_BASE_URL을 확인해 주세요.',
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
      nickname: '말랑이 친구',
    },
    wallet: {
      jelly: 20,
    },
    progress: {
      currentChapterId: 'absolute_beginner_chapter_001',
      currentStageId: 'absolute_beginner_chapter_001_stage_001',
    },
  }
}

export async function tossLogin(
  payload: TossLoginApiRequest,
): Promise<TossLoginApiResponse> {
  const baseUrl = getAuthApiBaseUrl()
  const url = `${baseUrl}/toss-login`
  console.log('[authApi] tossLogin: url =', url)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('[authApi] tossLogin: response status =', response.status)

    const result = (await response.json()) as
      | {
          success: true
          data: TossLoginApiResponse
        }
      | {
          success: false
          error?: {
            message?: string
            code?: string
            details?: unknown
          }
        }

    if (!response.ok || !result.success) {
      const failure = result as { success: false; error?: { message?: string; code?: string; details?: unknown } }
      console.error('[authApi] tossLogin: error code =', failure.error?.code, '| message =', failure.error?.message, '| details =', JSON.stringify(failure.error?.details ?? null))
      throw new Error(failure.error?.message || '토스 로그인에 실패했어요.')
    }

    return result.data
  } catch (error) {
    if (isLocalDevEnvironment()) {
      console.warn('[authApi] tossLogin: local dev fallback to mock response')
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
