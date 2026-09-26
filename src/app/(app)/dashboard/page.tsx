import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { compute } from '@/lib/engine/compute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPHP } from '@/lib/format'
import type { InterestMethod, RepaymentType, AfterMaturity } from '@/lib/engine/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()

  const [{ data: loans = [] }, { data: payments = [] }] = await Promise.all([
    supabase
      .from('loans')
      .select(
        'id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status',
      ),
    supabase.from('payments').select('loan_id, amount, paid_on').is('deleted_at', null),
  ])

  const paymentsByLoan = new Map<string, { amount: number; paid_on: string }[]>()
  for (const p of payments ?? []) {
    const list = paymentsByLoan.get(p.loan_id) ?? []
    list.push({ amount: Number(p.amount), paid_on: p.paid_on })
    paymentsByLoan.set(p.loan_id, list)
  }

  let totalPrincipalActive = 0
  let totalOutstanding = 0
  let interestEarnedAllTime = 0
  let activeCount = 0
  let overdueCount = 0

  for (const loan of loans ?? []) {
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
      interestEarnedAllTime += Number(out.interestEarnedToDate.toFixed(2))
      if (loan.status === 'active') {
        activeCount++
        totalPrincipalActive += Number(loan.principal)
        totalOutstanding += Number(out.currentBalance.toFixed(2))
        if (out.schedule.some((r) => r.isOverdue)) overdueCount++
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Portfolio overview. Numbers recompute from your loans and payments on every load.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/borrowers/new">
            <Button variant="outline">New borrower</Button>
          </Link>
          <Link href="/loans/new">
            <Button>New loan</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Active loans" value={String(activeCount)} />
        <Tile label="Principal lent (active)" value={formatPHP(totalPrincipalActive)} />
        <Tile label="Total outstanding" value={formatPHP(totalOutstanding)} />
        <Tile label="Interest earned" value={formatPHP(interestEarnedAllTime)} />
      </div>
      {overdueCount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive text-base">
              {overdueCount} loan{overdueCount === 1 ? '' : 's'} overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/loans" className="text-sm underline">
              Open the loans list
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}
