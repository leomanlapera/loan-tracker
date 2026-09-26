import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { loadEnvLocal, requireEnv } from './env'

loadEnvLocal()

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const SERVICE_ROLE = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

// Node 20 has no global WebSocket. realtime-js constructs one even if we never
// subscribe, so hand it a ws-backed constructor.
const clientOpts = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
}

export interface TestUser {
  id: string
  email: string
  password: string
  client: SupabaseClient
}

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE, clientOpts)
}

/**
 * Creates a confirmed user via the admin API and returns an anon client
 * signed in as that user (subject to RLS).
 */
export async function createTestUser(prefix = 'rls'): Promise<TestUser> {
  const admin = adminClient()
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `${prefix}-${suffix}@loan-tracker.test`
  const password = `Password!${suffix}`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`)

  const client = createClient(SUPABASE_URL, ANON_KEY, clientOpts)
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.error) throw new Error(`signIn failed: ${signIn.error.message}`)

  return { id: data.user.id, email, password, client }
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminClient()
  await admin.auth.admin.deleteUser(userId)
}
