import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase Admin client (SERVICE_ROLE_KEY).
 *
 * Security: this module is intentionally isolated from `lib/supabase.ts` (which is
 * imported by client components) so the service role logic can't be accidentally
 * pulled into the browser bundle.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase admin environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

