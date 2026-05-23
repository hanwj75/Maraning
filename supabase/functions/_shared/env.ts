function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getEnvOrDefault(name: string, defaultValue: string): string {
  const value = Deno.env.get(name)
  return value && value.length > 0 ? value : defaultValue
}

function getOptionalEnv(name: string): string | undefined {
  const value = Deno.env.get(name)
  return value && value.length > 0 ? value : undefined
}

export const env = {
  supabaseUrl: getRequiredEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  tossApiBaseUrl: getEnvOrDefault(
    'TOSS_API_BASE_URL',
    'https://apps-in-toss-api.toss.im',
  ),
  appSessionJwtSecret: getRequiredEnv('APP_SESSION_JWT_SECRET'),
  tossClientCert: getOptionalEnv('TOSS_CLIENT_CERT'),
  tossClientKey: getOptionalEnv('TOSS_CLIENT_KEY'),
  tossClientId: getOptionalEnv('TOSS_CLIENT_ID'),
  tossDecryptionKey: getOptionalEnv('TOSS_DECRYPTION_KEY'),
  tossDecryptionAad: getOptionalEnv('TOSS_DECRYPTION_AAD'),
}
