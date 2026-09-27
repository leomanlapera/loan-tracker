'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { borrowerSchema } from '@/lib/validation/borrower'

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

async function requireUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function createBorrower(input: unknown): Promise<ActionResult> {
  const parsed = borrowerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const { supabase, userId } = await requireUserId()
  const { data, error } = await supabase
    .from('borrowers')
    .insert({
      user_id: userId,
      full_name: parsed.data.fullName,
      mobile: parsed.data.mobile,
      email: parsed.data.email,
      address: parsed.data.address,
      notes: parsed.data.notes,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePath('/borrowers')
  return { ok: true, id: data.id }
}

export async function updateBorrower(id: string, input: unknown): Promise<ActionResult> {
  const parsed = borrowerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const { supabase } = await requireUserId()
  const { error } = await supabase
    .from('borrowers')
    .update({
      full_name: parsed.data.fullName,
      mobile: parsed.data.mobile,
      email: parsed.data.email,
      address: parsed.data.address,
      notes: parsed.data.notes,
    })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/borrowers')
  revalidatePath(`/borrowers/${id}`)
  return { ok: true, id }
}

export async function archiveBorrower(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await requireUserId()
  const { error } = await supabase
    .from('borrowers')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/borrowers')
  revalidatePath(`/borrowers/${id}`)
  return { ok: true, id }
}

export async function bulkArchiveBorrowers(
  ids: string[],
  archived: boolean,
): Promise<ActionResult & { count?: number }> {
  if (ids.length === 0) return { ok: true, count: 0 }
  const { supabase } = await requireUserId()
  const { error, count } = await supabase
    .from('borrowers')
    .update(
      { archived_at: archived ? new Date().toISOString() : null },
      { count: 'exact' },
    )
    .in('id', ids)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/borrowers')
  return { ok: true, count: count ?? ids.length }
}

export async function deleteBorrower(id: string): Promise<ActionResult> {
  const { supabase } = await requireUserId()
  const { count, error: countError } = await supabase
    .from('loans')
    .select('id', { count: 'exact', head: true })
    .eq('borrower_id', id)
    .in('status', ['active'])
  if (countError) return { ok: false, error: countError.message }
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: 'Cannot delete a borrower with active loans. Archive instead.',
    }
  }
  const { error } = await supabase.from('borrowers').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/borrowers')
  return { ok: true }
}
