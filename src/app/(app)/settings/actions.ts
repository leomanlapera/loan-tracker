'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { settingsSchema } from '@/lib/validation/settings'

export type SettingsActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

export async function updateSettings(input: unknown): Promise<SettingsActionResult> {
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.displayName ?? null,
      default_grace_days: parsed.data.defaultGraceDays,
      default_interest_method: parsed.data.defaultInterestMethod,
      default_repayment_type: parsed.data.defaultRepaymentType,
    })
    .eq('id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings')
  revalidatePath('/loans/new')
  return { ok: true, message: 'Settings saved.' }
}
