import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { compute } from '@/lib/engine/compute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPHP, formatRate } from '@/lib/format'
import type { InterestMethod, RepaymentType, AfterMaturity } from '@/lib/engine/types'

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: loan } = await supabase
    .from('loans')
    .select(
      'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status, notes, reference_no, agreement_in_writing',
    )
    .eq('id', id)
    .maybeSingle()
  if (!loan) notFound()

  const [{ data: borrower }, { data: payments = [] }] = await Promise.all([
    supabase.from('borrowers').select('id, full_name').eq('id', loan.borrower_id).maybeSingle(),
    supabase
      .from('payments')
      .select('amount, paid_on')
      .eq('loan_id', id)
      .is('deleted_at', null)
      .order('paid_on'),
  ])

  const now = new Date()
  let summary
  try {
    summary = compute({
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
      payments: (payments ?? []).map((p) => ({
        amount: Number(p.amount),
        paidOn: new Date(`${p.paid_on}T00:00:00Z`),
      })),
      asOf: now,
    })
  } catch {
    summary = null
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/loans" className="text-muted-foreground text-sm hover:underline">
          ← Loans
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {borrower ? borrower.full_name : 'Loan'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Started {formatDate(loan.start_date)} · {formatPHP(Number(loan.principal))} @{' '}
            {formatRate(Number(loan.monthly_rate))} · {loan.tenure_months} months
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">{loan.status}</Badge>
            <Badge variant="outline">{loan.interest_method}</Badge>
            <Badge variant="outline">{loan.repayment_type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/loans/${loan.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Current balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {summary ? formatPHP(summary.currentBalance.toFixed(2)) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {summary ? formatPHP(summary.totalPaid.toFixed(2)) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Interest earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {summary ? formatPHP(summary.interestEarnedToDate.toFixed(2)) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">Next due</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.nextDueDate ? (
              <>
                <div className="text-lg font-semibold">{formatDate(summary.nextDueDate)}</div>
                <div className="text-muted-foreground text-sm tabular-nums">
                  {formatPHP(summary.nextDueAmount.toFixed(2))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">No upcoming due</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments and schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Payment logging and the full schedule table land in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
