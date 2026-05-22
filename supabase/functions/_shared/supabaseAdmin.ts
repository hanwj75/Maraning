import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { env } from './env.ts'

let supabaseAdminSingleton:
  | ReturnType<typeof createClient>
  | null = null

export function getSupabaseAdmin() {
  if (supabaseAdminSingleton) {
    return supabaseAdminSingleton
  }

  supabaseAdminSingleton = createClient(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )

  return supabaseAdminSingleton
}
