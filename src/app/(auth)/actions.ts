'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import {
  loginSchema,
  requestResetSchema,
  updatePasswordSchema,
} from '@/lib/validation/auth'

export type ActionState = { ok: false; error: string } | { ok: true; message?: string } | null

function firstError(result: { error?: { errors?: Array<{ message: string }> } } | { success: false; error: { issues: Array<{ message: string }> } }): string {
  if ('success' in result && !result.success) {
    return result.error.issues[0]?.message ?? 'Invalid input'
  }
  return 'Invalid input'
}

async function siteUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await rateLimit('login', { limit: 10, windowMs: 15 * 60 * 1000 })
  if (!gate.ok) {
    return {
      ok: false,
      error: `Too many sign-in attempts. Try again in ${Math.ceil(gate.retryAfterSeconds / 60)} minute(s).`,
    }
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { ok: false, error: firstError(parsed) }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { ok: false, error: error.message }

  const next = (formData.get('next') as string | null) || '/dashboard'
  redirect(next)
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const gate = await rateLimit('reset-password', { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!gate.ok) {
    return {
      ok: false,
      error: `Too many reset requests. Try again in ${Math.ceil(gate.retryAfterSeconds / 60)} minute(s).`,
    }
  }

  const parsed = requestResetSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { ok: false, error: firstError(parsed) }

  const supabase = await createClient()
  const site = await siteUrl()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/auth/callback?next=/reset-password/update`,
  })
  if (error) return { ok: false, error: error.message }

  return { ok: true, message: 'If that email exists, a reset link is on its way.' }
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) return { ok: false, error: firstError(parsed) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function deleteAccountAction(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`)
  }
  await supabase.auth.signOut()
  redirect('/')
}
