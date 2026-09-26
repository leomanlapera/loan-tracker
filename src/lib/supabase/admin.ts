import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Service-role client. Bypasses RLS. Server-only — the `server-only` import
 * makes any accidental client-side use a hard build error.
 *
 * Use for: account deletion (admin.deleteUser), migrations/seeding, RLS tests.
 * Never use for user-facing reads; use the request-scoped server client instead.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
    )
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
