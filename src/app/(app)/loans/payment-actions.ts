'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { paymentSchema } from '@/lib/validation/payment'
import { compute } from '@/lib/engine/compute'
import type {
  InterestMethod,
  RepaymentType,
  AfterMaturity,
  LoanInput,
  PaymentInput,
} from '@/lib/engine/types'

export type PaymentActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; payoffAmount?: string }

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

interface LoanRow {
  id: string
  principal: number
  monthly_rate: number
  tenure_months: number
  start_date: string
  interest_method: string
  repayment_type: string
  after_maturity: string
  grace_days: number
  borrower_id: string
}

async function loadLoanAndPayments(loanId: string, excludePaymentId?: string) {
  const { supabase } = await requireUser()
  const [{ data: loan }, { data: payments = [] }, { data: schedule = [] }] = await Promise.all([
    supabase
      .from('loans')
      .select(
        'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days',
      )
      .eq('id', loanId)
      .maybeSingle(),
    supabase
      .from('payments')
      .select('id, amount, paid_on')
      .eq('loan_id', loanId)
      .is('deleted_at', null),
    supabase.from('loan_custom_schedule').select('period, planned_amount').eq('loan_id', loanId),
  ])
  if (!loan) return null
  const kept: { id: string; amount: number; paid_on: string }[] = (payments ?? [])
    .filter((p) => p.id !== excludePaymentId)
    .map((p) => ({ id: p.id, amount: Number(p.amount), paid_on: p.paid_on }))
  const engineLoan: LoanInput = {
    principal: String(loan.principal),
    monthlyRate: String(loan.monthly_rate),
    tenureMonths: loan.tenure_months,
    startDate: new Date(`${loan.start_date}T00:00:00Z`),
    interestMethod: loan.interest_method as InterestMethod,
    repaymentType: loan.repayment_type as RepaymentType,
    afterMaturity: loan.after_maturity as AfterMaturity,
    graceDays: loan.grace_days,
    customSchedule:
      loan.repayment_type === 'custom'
        ? (schedule ?? []).map((s) => ({
            period: s.period,
            plannedAmount: String(s.planned_amount),
          }))
        : undefined,
  }
  return { supabase, loan: loan as LoanRow, engineLoan, keptPayments: kept }
}

function toEnginePayments(
  rows: { amount: number; paid_on: string }[],
  extra?: { amount: number; paid_on: string },
): PaymentInput[] {
  const list = extra ? [...rows, extra] : rows
  return list.map((p) => ({ amount: p.amount, paidOn: new Date(`${p.paid_on}T00:00:00Z`) }))
}

async function recomputeAndSyncStatus(loanId: string) {
  const ctx = await loadLoanAndPayments(loanId)
  if (!ctx) return
  const asOf = new Date()
  try {
    const out = compute({
      loan: ctx.engineLoan,
      payments: toEnginePayments(ctx.keptPayments),
      asOf,
    })
    const isPaid = out.currentBalance.lte(0)
    const nextStatus = isPaid ? 'paid' : 'active'
    const closedAt = isPaid ? new Date().toISOString() : null
    await ctx.supabase
      .from('loans')
      .update({ status: nextStatus, closed_at: closedAt })
      .eq('id', loanId)
      .in('status', ['active', 'paid'])
  } catch {
    // Bad state — leave status alone.
  }
}

export async function createPayment(
  loanId: string,
  input: unknown,
): Promise<PaymentActionResult> {
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const ctx = await loadLoanAndPayments(loanId)
  if (!ctx) return { ok: false, error: 'Loan not found' }
  const asOf = new Date(`${parsed.data.paidOn}T23:59:59Z`)
  let payoff
  try {
    payoff = compute({
      loan: ctx.engineLoan,
      payments: toEnginePayments(ctx.keptPayments),
      asOf,
    }).payoffAmount
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const amount = Number(parsed.data.amount)
  if (amount > Number(payoff.toFixed(2)) + 1e-9) {
    return {
      ok: false,
      error: `Payment exceeds payoff amount of ₱${payoff.toFixed(2)} on ${parsed.data.paidOn}.`,
      payoffAmount: payoff.toFixed(2),
    }
  }
  const { supabase, userId } = await requireUser()
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      loan_id: loanId,
      amount,
      paid_on: parsed.data.paidOn,
      method: parsed.data.method,
      reference_no: parsed.data.referenceNo ?? null,
      note: parsed.data.note ?? null,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  await recomputeAndSyncStatus(loanId)
  revalidatePath(`/loans/${loanId}`)
  revalidatePath('/loans')
  revalidatePath('/dashboard')
  revalidatePath(`/borrowers/${ctx.loan.borrower_id}`)
  return { ok: true, id: data.id }
}

export async function updatePayment(
  loanId: string,
  paymentId: string,
  input: unknown,
): Promise<PaymentActionResult> {
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', fieldErrors: fieldErrorsFromZod(parsed.error) }
  }
  const ctx = await loadLoanAndPayments(loanId, paymentId)
  if (!ctx) return { ok: false, error: 'Loan not found' }
  const asOf = new Date(`${parsed.data.paidOn}T23:59:59Z`)
  let payoff
  try {
    payoff = compute({
      loan: ctx.engineLoan,
      payments: toEnginePayments(ctx.keptPayments),
      asOf,
    }).payoffAmount
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  const amount = Number(parsed.data.amount)
  if (amount > Number(payoff.toFixed(2)) + 1e-9) {
    return {
      ok: false,
      error: `Payment exceeds payoff amount of ₱${payoff.toFixed(2)} on ${parsed.data.paidOn}.`,
      payoffAmount: payoff.toFixed(2),
    }
  }
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('payments')
    .update({
      amount,
      paid_on: parsed.data.paidOn,
      method: parsed.data.method,
      reference_no: parsed.data.referenceNo ?? null,
      note: parsed.data.note ?? null,
    })
    .eq('id', paymentId)
  if (error) return { ok: false, error: error.message }
  await recomputeAndSyncStatus(loanId)
  revalidatePath(`/loans/${loanId}`)
  revalidatePath('/loans')
  revalidatePath('/dashboard')
  return { ok: true, id: paymentId }
}

export async function softDeletePayment(
  loanId: string,
  paymentId: string,
): Promise<PaymentActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', paymentId)
  if (error) return { ok: false, error: error.message }
  await recomputeAndSyncStatus(loanId)
  revalidatePath(`/loans/${loanId}`)
  revalidatePath('/loans')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function restorePayment(
  loanId: string,
  paymentId: string,
): Promise<PaymentActionResult> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: null })
    .eq('id', paymentId)
  if (error) return { ok: false, error: error.message }
  await recomputeAndSyncStatus(loanId)
  revalidatePath(`/loans/${loanId}`)
  return { ok: true }
}

export async function computePayoff(
  loanId: string,
  paidOnISO: string = format(new Date(), 'yyyy-MM-dd'),
): Promise<{ ok: boolean; amount?: string; error?: string }> {
  const ctx = await loadLoanAndPayments(loanId)
  if (!ctx) return { ok: false, error: 'Loan not found' }
  try {
    const asOf = new Date(`${paidOnISO}T23:59:59Z`)
    const out = compute({
      loan: ctx.engineLoan,
      payments: toEnginePayments(ctx.keptPayments),
      asOf,
    })
    return { ok: true, amount: out.payoffAmount.toFixed(2) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
