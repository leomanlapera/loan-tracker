import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { compute } from '@/lib/engine/compute'
import { Button } from '@/components/ui/button'
import { LoansTable, type LoanRow } from './loans-table'
import type { InterestMethod, RepaymentType, AfterMaturity } from '@/lib/engine/types'

export default async function LoansPage() {
  const supabase = await createClient()
  const now = new Date()

  const [{ data: loans = [] }, { data: borrowers = [] }, { data: payments = [] }] =
    await Promise.all([
      supabase
        .from('loans')
        .select(
          'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status',
        )
        .order('created_at', { ascending: false }),
      supabase.from('borrowers').select('id, full_name'),
      supabase.from('payments').select('loan_id, amount, paid_on').is('deleted_at', null),
    ])

  const borrowerName = new Map((borrowers ?? []).map((b) => [b.id, b.full_name]))
  const paymentsByLoan = new Map<string, { amount: number; paid_on: string }[]>()
  for (const p of payments ?? []) {
    const list = paymentsByLoan.get(p.loan_id) ?? []
    list.push({ amount: Number(p.amount), paid_on: p.paid_on })
    paymentsByLoan.set(p.loan_id, list)
  }

  const rows: LoanRow[] = (loans ?? []).map((loan) => {
    let currentBalance = '0.00'
    let nextDueDate: string | null = null
    let nextDueAmount = '0.00'
    let isOverdue = false
    let balanceHistory: number[] = [Number(loan.principal)]
    try {
      const out = compute({
        loan: {
          principal: String(loan.principal),
          monthlyRate: String(loan.monthly_rate),
          tenureMonths: loan.tenure_months,
          startDate: new Date(`${loan.start_date}T00:00:00Z`),
          interestMethod: loan.interest_method as InterestMethod,
          repaymentType: loan.repayment_type as RepaymentType,
          afterMaturity: loan.after_maturity as AfterMaturity,
          graceDays: loan.grace_days,
        },
        payments: (paymentsByLoan.get(loan.id) ?? []).map((p) => ({
          amount: p.amount,
          paidOn: new Date(`${p.paid_on}T00:00:00Z`),
        })),
        asOf: now,
      })
      currentBalance = out.currentBalance.toFixed(2)
      nextDueDate = out.nextDueDate ? out.nextDueDate.toISOString() : null
      nextDueAmount = out.nextDueAmount.toFixed(2)
      isOverdue = out.schedule.some((r) => r.isOverdue)
      // Sparkline series: principal → closing balance of each past period → current.
      // The final point pins the line to what the row's "Balance" column shows.
      const past = out.schedule.filter((r) => r.dueDate <= now)
      balanceHistory = [
        Number(loan.principal),
        ...past.map((r) => Number(r.closingBalance.toFixed(2))),
      ]
      const last = balanceHistory[balanceHistory.length - 1]
      const currentNum = Number(currentBalance)
      if (last !== currentNum) balanceHistory.push(currentNum)
    } catch {}
    return {
      id: loan.id,
      borrowerId: loan.borrower_id,
      borrowerName: borrowerName.get(loan.borrower_id) ?? 'Unknown',
      principal: String(loan.principal),
      monthlyRate: String(loan.monthly_rate),
      status: loan.status,
      startDate: loan.start_date,
      currentBalance,
      nextDueDate,
      nextDueAmount,
      isOverdue,
      balanceHistory,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
          <p className="text-sm text-muted-foreground">
            Every loan you&apos;ve issued. Balances update from logged payments.
          </p>
        </div>
        <Link href="/loans/new">
          <Button>New loan</Button>
        </Link>
      </div>
      <LoansTable rows={rows} />
    </div>
  )
}
