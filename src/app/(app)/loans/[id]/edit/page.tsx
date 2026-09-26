import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoanForm, type BorrowerOption } from '../../loan-form'
import type { LoanInput } from '@/lib/validation/loan'

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: loan } = await supabase
    .from('loans')
    .select(
      'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, agreement_in_writing, notes, reference_no',
    )
    .eq('id', id)
    .maybeSingle()
  if (!loan) notFound()

  const [{ data: borrowers = [] }, { data: schedule = [] }, { count: paymentCount }] =
    await Promise.all([
      supabase
        .from('borrowers')
        .select('id, full_name')
        .order('full_name'),
      supabase
        .from('loan_custom_schedule')
        .select('period, planned_amount')
        .eq('loan_id', id)
        .order('period'),
      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('loan_id', id)
        .is('deleted_at', null),
    ])

  const hasPayments = (paymentCount ?? 0) > 0

  const initial: Partial<LoanInput> = {
    borrowerId: loan.borrower_id,
    principal: String(loan.principal),
    monthlyRate: String(loan.monthly_rate),
    tenureMonths: loan.tenure_months,
    startDate: loan.start_date,
    interestMethod: loan.interest_method,
    repaymentType: loan.repayment_type,
    afterMaturity: loan.after_maturity,
    graceDays: loan.grace_days,
    agreementInWriting: loan.agreement_in_writing,
    notes: loan.notes,
    referenceNo: loan.reference_no,
    customSchedule:
      loan.repayment_type === 'custom'
        ? (schedule ?? []).map((s) => ({
            period: s.period,
            plannedAmount: String(s.planned_amount),
          }))
        : undefined,
  }

  const options: BorrowerOption[] = (borrowers ?? []).map((b) => ({
    id: b.id,
    name: b.full_name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/loans/${id}`} className="text-muted-foreground text-sm hover:underline">
          ← Back to loan
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit loan</h1>
        {hasPayments ? (
          <p className="text-sm text-muted-foreground">
            Principal, rate, start date, and interest method are locked because payments exist.
          </p>
        ) : null}
      </div>
      <LoanForm
        mode="edit"
        loanId={id}
        borrowers={options}
        initial={initial}
        editingLocked={{
          principal: hasPayments,
          monthlyRate: hasPayments,
          startDate: hasPayments,
          interestMethod: hasPayments,
        }}
      />
    </div>
  )
}
