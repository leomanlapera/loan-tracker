import { createClient } from '@/lib/supabase/server'
import { compute } from '@/lib/engine/compute'
import type {
  InterestMethod,
  RepaymentType,
  AfterMaturity,
  LoanInput,
  PaymentInput,
  EngineOutput,
  CustomScheduleEntry,
} from '@/lib/engine/types'

export interface LoanDataRow {
  id: string
  borrower_id: string
  borrower_name: string
  principal: number
  monthly_rate: number
  tenure_months: number
  start_date: string
  interest_method: InterestMethod
  repayment_type: RepaymentType
  after_maturity: AfterMaturity
  grace_days: number
  status: string
  closed_at: string | null
  reference_no: string | null
  notes: string | null
  agreement_in_writing: boolean
  customSchedule?: CustomScheduleEntry[]
  payments: PaymentRecord[]
}

export interface PaymentRecord {
  id: string
  amount: number
  paid_on: string
  method: string
  reference_no: string | null
  note: string | null
  deleted_at: string | null
  loan_id: string
}

/**
 * Load every loan (with borrower name, custom schedule, and non-deleted payments)
 * owned by the current user. Reports build on this bundle.
 */
export async function loadAllLoans(): Promise<LoanDataRow[]> {
  const supabase = await createClient()

  const [
    { data: loans = [] },
    { data: borrowers = [] },
    { data: payments = [] },
    { data: schedules = [] },
  ] = await Promise.all([
    supabase
      .from('loans')
      .select(
        'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status, closed_at, reference_no, notes, agreement_in_writing',
      ),
    supabase.from('borrowers').select('id, full_name'),
    supabase.from('payments').select('id, loan_id, amount, paid_on, method, reference_no, note, deleted_at'),
    supabase.from('loan_custom_schedule').select('loan_id, period, planned_amount'),
  ])

  const nameById = new Map((borrowers ?? []).map((b) => [b.id, b.full_name]))
  const paymentsByLoan = new Map<string, PaymentRecord[]>()
  for (const p of payments ?? []) {
    const list = paymentsByLoan.get(p.loan_id) ?? []
    list.push({
      id: p.id,
      amount: Number(p.amount),
      paid_on: p.paid_on,
      method: p.method,
      reference_no: p.reference_no,
      note: p.note,
      deleted_at: p.deleted_at,
      loan_id: p.loan_id,
    })
    paymentsByLoan.set(p.loan_id, list)
  }
  const scheduleByLoan = new Map<string, CustomScheduleEntry[]>()
  for (const s of schedules ?? []) {
    const list = scheduleByLoan.get(s.loan_id) ?? []
    list.push({ period: s.period, plannedAmount: String(s.planned_amount) })
    scheduleByLoan.set(s.loan_id, list)
  }

  return (loans ?? []).map((l) => ({
    id: l.id,
    borrower_id: l.borrower_id,
    borrower_name: nameById.get(l.borrower_id) ?? 'Unknown',
    principal: Number(l.principal),
    monthly_rate: Number(l.monthly_rate),
    tenure_months: l.tenure_months,
    start_date: l.start_date,
    interest_method: l.interest_method as InterestMethod,
    repayment_type: l.repayment_type as RepaymentType,
    after_maturity: l.after_maturity as AfterMaturity,
    grace_days: l.grace_days,
    status: l.status,
    closed_at: l.closed_at,
    reference_no: l.reference_no,
    notes: l.notes,
    agreement_in_writing: l.agreement_in_writing,
    customSchedule: l.repayment_type === 'custom' ? scheduleByLoan.get(l.id) : undefined,
    payments: paymentsByLoan.get(l.id) ?? [],
  }))
}

export function toEngineLoan(row: LoanDataRow): LoanInput {
  return {
    principal: String(row.principal),
    monthlyRate: String(row.monthly_rate),
    tenureMonths: row.tenure_months,
    startDate: new Date(`${row.start_date}T00:00:00Z`),
    interestMethod: row.interest_method,
    repaymentType: row.repayment_type,
    afterMaturity: row.after_maturity,
    graceDays: row.grace_days,
    customSchedule: row.customSchedule,
  }
}

export function activePayments(row: LoanDataRow, upToDate?: Date): PaymentInput[] {
  const cutoff = upToDate ? upToDate.getTime() : Number.POSITIVE_INFINITY
  return row.payments
    .filter((p) => !p.deleted_at)
    .filter((p) => new Date(`${p.paid_on}T00:00:00Z`).getTime() <= cutoff)
    .map((p) => ({ amount: p.amount, paidOn: new Date(`${p.paid_on}T00:00:00Z`) }))
}

export function summarizeAt(row: LoanDataRow, asOf: Date): EngineOutput | null {
  try {
    return compute({ loan: toEngineLoan(row), payments: activePayments(row, asOf), asOf })
  } catch {
    return null
  }
}
