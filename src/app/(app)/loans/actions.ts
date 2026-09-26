'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { loanSchema } from '@/lib/validation/loan'

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

export async function createLoan(input: unknown): Promise<ActionResult> {
  const parsed = loanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const { supabase, userId } = await requireUserId()
  const d = parsed.data
  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: userId,
      borrower_id: d.borrowerId,
      principal: Number(d.principal),
      monthly_rate: Number(d.monthlyRate),
      tenure_months: d.tenureMonths,
      start_date: d.startDate,
      interest_method: d.interestMethod,
      repayment_type: d.repaymentType,
      after_maturity: d.afterMaturity,
      grace_days: d.graceDays,
      agreement_in_writing: d.agreementInWriting,
      notes: d.notes ?? null,
      reference_no: d.referenceNo ?? null,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  if (d.repaymentType === 'custom' && d.customSchedule?.length) {
    const rows = d.customSchedule.map((r) => ({
      loan_id: data.id,
      period: r.period,
      planned_amount: Number(r.plannedAmount),
    }))
    const { error: scheduleError } = await supabase.from('loan_custom_schedule').insert(rows)
    if (scheduleError) {
      await supabase.from('loans').delete().eq('id', data.id)
      return { ok: false, error: `Loan created but schedule failed: ${scheduleError.message}` }
    }
  }

  revalidatePath('/loans')
  revalidatePath('/borrowers')
  revalidatePath(`/borrowers/${d.borrowerId}`)
  return { ok: true, id: data.id }
}

export async function updateLoan(id: string, input: unknown): Promise<ActionResult> {
  const parsed = loanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const { supabase } = await requireUserId()
  const d = parsed.data
  const { error } = await supabase
    .from('loans')
    .update({
      borrower_id: d.borrowerId,
      principal: Number(d.principal),
      monthly_rate: Number(d.monthlyRate),
      tenure_months: d.tenureMonths,
      start_date: d.startDate,
      interest_method: d.interestMethod,
      repayment_type: d.repaymentType,
      after_maturity: d.afterMaturity,
      grace_days: d.graceDays,
      agreement_in_writing: d.agreementInWriting,
      notes: d.notes ?? null,
      reference_no: d.referenceNo ?? null,
    })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  if (d.repaymentType === 'custom' && d.customSchedule?.length) {
    await supabase.from('loan_custom_schedule').delete().eq('loan_id', id)
    const rows = d.customSchedule.map((r) => ({
      loan_id: id,
      period: r.period,
      planned_amount: Number(r.plannedAmount),
    }))
    const { error: scheduleError } = await supabase.from('loan_custom_schedule').insert(rows)
    if (scheduleError) return { ok: false, error: scheduleError.message }
  } else {
    await supabase.from('loan_custom_schedule').delete().eq('loan_id', id)
  }

  revalidatePath('/loans')
  revalidatePath(`/loans/${id}`)
  revalidatePath(`/loans/${id}/edit`)
  return { ok: true, id }
}

export async function cancelLoan(id: string): Promise<ActionResult> {
  const { supabase } = await requireUserId()
  const { count } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('loan_id', id)
    .is('deleted_at', null)
  if ((count ?? 0) > 0) {
    return { ok: false, error: 'Cannot cancel a loan with payments. Write off instead.' }
  }
  const { error } = await supabase
    .from('loans')
    .update({ status: 'cancelled', closed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/loans')
  revalidatePath(`/loans/${id}`)
  return { ok: true, id }
}

export async function writeOffLoan(id: string): Promise<ActionResult> {
  const { supabase } = await requireUserId()
  const { error } = await supabase
    .from('loans')
    .update({ status: 'written_off', closed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/loans')
  revalidatePath(`/loans/${id}`)
  return { ok: true, id }
}

export async function reopenLoan(id: string): Promise<ActionResult> {
  const { supabase } = await requireUserId()
  const { error } = await supabase
    .from('loans')
    .update({ status: 'active', closed_at: null })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/loans')
  revalidatePath(`/loans/${id}`)
  return { ok: true, id }
}
