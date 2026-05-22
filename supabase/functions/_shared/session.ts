import { env } from './env.ts'

type AppSessionPayload = {
  sub: string
  tossUserKey: number
  iat: number
  exp: number
}

const APP_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toBase64Url(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(env.appSessionJwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(input: string): Promise<string> {
  const key = await getSigningKey()
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(input),
  )
  return toBase64Url(new Uint8Array(signature))
}

async function verifySignature(
  input: string,
  signature: string,
): Promise<boolean> {
  const key = await getSigningKey()
  return crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signature),
    textEncoder.encode(input),
  )
}

export async function createAppSession(
  userId: string,
  tossUserKey: number,
) {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(
    textEncoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
  )
  const payload = toBase64Url(
    textEncoder.encode(
      JSON.stringify({
        sub: userId,
        tossUserKey,
        iat: now,
        exp: now + APP_SESSION_TTL_SECONDS,
      } satisfies AppSessionPayload),
    ),
  )
  const unsignedToken = `${header}.${payload}`
  const signature = await sign(unsignedToken)

  return `${unsignedToken}.${signature}`
}

export async function verifyAppSession(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  const [header, payload, signature] = token.split('.')

  if (!header || !payload || !signature) {
    throw new Error('Malformed session token')
  }

  const unsignedToken = `${header}.${payload}`
  const isValidSignature = await verifySignature(unsignedToken, signature)

  if (!isValidSignature) {
    throw new Error('Invalid session signature')
  }

  const decodedPayload = JSON.parse(
    textDecoder.decode(fromBase64Url(payload)),
  ) as AppSessionPayload

  if (decodedPayload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Session token expired')
  }

  return decodedPayload
}
