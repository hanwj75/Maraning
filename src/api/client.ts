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

  if (options.sessionToken) {
    headers.Authorization = `Bearer ${options.sessionToken}`
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

    throw new ApiClientError(
      result && !result.success
        ? result.error?.message || fallbackMessage
        : fallbackMessage,
      {
        code: result && !result.success ? result.error?.code : null,
        status: response.status,
        details: result && !result.success ? result.error?.details : null,
      },
    )
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
