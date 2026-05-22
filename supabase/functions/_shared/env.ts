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

export const env = {
  supabaseUrl: getRequiredEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  tossApiBaseUrl: getEnvOrDefault(
    'TOSS_API_BASE_URL',
    'https://apps-in-toss-api.toss.im',
  ),
  appSessionJwtSecret: getRequiredEnv('APP_SESSION_JWT_SECRET'),
}
