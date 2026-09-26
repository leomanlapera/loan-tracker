import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { summarize } from '@/lib/engine/loan-summary'
import { Button } from '@/components/ui/button'
import { BorrowerSearch, type BorrowerRow } from './borrower-search'
import type { InterestMethod, RepaymentType, AfterMaturity } from '@/lib/engine/types'

export default async function BorrowersPage() {
  const supabase = await createClient()
  const now = new Date()

  const [{ data: borrowers = [] }, { data: loans = [] }, { data: payments = [] }] =
    await Promise.all([
      supabase
        .from('borrowers')
        .select('id, full_name, mobile, email, archived_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('loans')
        .select(
          'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status',
        ),
      supabase
        .from('payments')
        .select('loan_id, amount, paid_on')
        .is('deleted_at', null),
    ])

  const paymentsByLoan = new Map<string, { amount: number; paid_on: string }[]>()
  for (const p of payments ?? []) {
    const list = paymentsByLoan.get(p.loan_id) ?? []
    list.push({ amount: Number(p.amount), paid_on: p.paid_on })
    paymentsByLoan.set(p.loan_id, list)
  }

  const outstandingByBorrower = new Map<string, number>()
  const activeCountByBorrower = new Map<string, number>()

  for (const loan of loans ?? []) {
    const summary = summarize(
      {
        principal: Number(loan.principal),
        monthlyRate: Number(loan.monthly_rate),
        tenureMonths: loan.tenure_months,
        startDate: new Date(`${loan.start_date}T00:00:00Z`),
        interestMethod: loan.interest_method as InterestMethod,
        repaymentType: loan.repayment_type as RepaymentType,
        afterMaturity: loan.after_maturity as AfterMaturity,
        graceDays: loan.grace_days,
      },
      (paymentsByLoan.get(loan.id) ?? []).map((p) => ({
        amount: p.amount,
        paidOn: new Date(`${p.paid_on}T00:00:00Z`),
      })),
      now,
    )
    if (!summary) continue
    if (loan.status === 'active') {
      activeCountByBorrower.set(
        loan.borrower_id,
        (activeCountByBorrower.get(loan.borrower_id) ?? 0) + 1,
      )
      outstandingByBorrower.set(
        loan.borrower_id,
        (outstandingByBorrower.get(loan.borrower_id) ?? 0) + Number(summary.currentBalance.toFixed(2)),
      )
    }
  }

  const rows: BorrowerRow[] = (borrowers ?? []).map((b) => ({
    id: b.id,
    fullName: b.full_name,
    mobile: b.mobile,
    email: b.email,
    archivedAt: b.archived_at,
    activeLoanCount: activeCountByBorrower.get(b.id) ?? 0,
    totalOutstanding: (outstandingByBorrower.get(b.id) ?? 0).toFixed(2),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Borrowers</h1>
          <p className="text-sm text-muted-foreground">
            People you&apos;ve lent money to. Add one before creating a loan.
          </p>
        </div>
        <Link href="/borrowers/new" className="inline-block">
          <Button>New borrower</Button>
        </Link>
      </div>
      <BorrowerSearch rows={rows} />
    </div>
  )
}
