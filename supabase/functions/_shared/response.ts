import { corsHeaders } from './cors.ts'

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export function jsonSuccess<T extends JsonValue>(
  data: T,
  init?: ResponseInit,
) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...init?.headers,
    },
  })
}

export function jsonError(
  message: string,
  init?: ResponseInit & { code?: string; details?: JsonValue },
) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message,
        code: init?.code ?? 'unknown_error',
        details: init?.details ?? null,
      },
    }),
    {
      status: init?.status ?? 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...init?.headers,
      },
    },
  )
}
