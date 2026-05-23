import { getAuthApiBaseUrl } from './authApi'
import { useSessionStore } from '../stores/sessionStore'

type JsonRecord = Record<string, unknown>

export class ApiClientError extends Error {
  code: string | null
  status: number
  details: unknown

  constructor(
    message: string,
    params: { code?: string | null; status: number; details?: unknown },
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.code = params.code ?? null
    this.status = params.status
    this.details = params.details ?? null
  }
}

type ApiRequestOptions = {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  sessionToken?: string | null
  body?: unknown
  headers?: Record<string, string>
}

type ApiEnvelope<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error?: {
        message?: string
        code?: string
        details?: unknown
      }
    }

function buildHeaders(options: ApiRequestOptions) {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  const token = options.sessionToken ?? useSessionStore.getState().sessionToken

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

async function parseApiEnvelope<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  let result: ApiEnvelope<T> | null = null

  try {
    result = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiClientError(fallbackMessage, {
      status: response.status,
    })
  }

  if (!response.ok || !result.success) {
    if (response.status === 401) {
      useSessionStore.getState().expireSession()
    }

    const failure = result as {
      success: false
      error?: { message?: string; code?: string; details?: unknown }
    }
    throw new ApiClientError(failure.error?.message || fallbackMessage, {
      code: failure.error?.code ?? null,
      status: response.status,
      details: failure.error?.details ?? null,
    })
  }

  return result.data
}

export async function apiRequest<T>(
  options: ApiRequestOptions,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${getAuthApiBaseUrl()}${options.path}`, {
    method: options.method ?? 'GET',
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  return parseApiEnvelope<T>(response, fallbackMessage)
}

export type { JsonRecord }
