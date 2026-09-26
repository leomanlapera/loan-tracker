import Link from 'next/link'
import {
  format,
  startOfMonth,
  startOfYear,
  isWithinInterval,
  addDays,
  isAfter,
} from 'date-fns'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GlobalLogPaymentButton } from '@/components/global-log-payment'
import { formatDate, formatPHP } from '@/lib/format'
import { loadAllLoans, summarizeAt, activePayments } from '@/lib/reports/loans'
import { allocatePayments } from '@/lib/engine/allocate'
import { paymentMethodLabels, type PaymentMethod } from '@/lib/validation/payment'

export default async function DashboardPage() {
  const loans = await loadAllLoans()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const yearStart = startOfYear(now)
  const in7 = addDays(now, 7)

  let activeCount = 0
  let totalPrincipalActive = 0
  let totalOutstanding = 0
  let interestAllTime = 0
  let interestThisYear = 0
  let interestThisMonth = 0
  let collectionsThisMonth = 0
  let overdueCount = 0
  let overdueAmount = 0
  const overdueLoans: {
    loanId: string
    borrower: string
    daysPastDue: number
    amount: string
  }[] = []
  const upcoming: {
    loanId: string
    borrower: string
    dueDate: Date
    amount: string
  }[] = []
  const recentPayments: {
    loanId: string
    borrower: string
    paidOn: string
    amount: number
    method: PaymentMethod
  }[] = []

  for (const loan of loans) {
    const summary = summarizeAt(loan, now)
    if (!summary) continue

    interestAllTime += Number(summary.interestEarnedToDate.toFixed(2))

    if (loan.status === 'active') {
      activeCount++
      totalPrincipalActive += loan.principal
      totalOutstanding += Number(summary.currentBalance.toFixed(2))
      if (summary.schedule.some((r) => r.isOverdue)) {
        overdueCount++
        let loanShortfall = 0
        let oldestDaysPastDue = 0
        for (const row of summary.schedule) {
          if (!row.isOverdue) continue
          const shortfall = Number(row.scheduledPayment.minus(row.actualPayment).toFixed(2))
          overdueAmount += shortfall
          loanShortfall += shortfall
          const days = Math.max(
            0,
            Math.floor((now.getTime() - row.dueDate.getTime()) / 86_400_000) - loan.grace_days,
          )
          if (days > oldestDaysPastDue) oldestDaysPastDue = days
        }
        overdueLoans.push({
          loanId: loan.id,
          borrower: loan.borrower_name,
          daysPastDue: oldestDaysPastDue,
          amount: loanShortfall.toFixed(2),
        })
      }
      if (summary.nextDueDate && !isAfter(summary.nextDueDate, in7)) {
        upcoming.push({
          loanId: loan.id,
          borrower: loan.borrower_name,
          dueDate: summary.nextDueDate,
          amount: summary.nextDueAmount.toFixed(2),
        })
      }
    }

    // Per-payment allocation for month/year interest and this-month collections.
    try {
      const allocs = allocatePayments(
        {
          principal: String(loan.principal),
          monthlyRate: String(loan.monthly_rate),
          tenureMonths: loan.tenure_months,
          startDate: new Date(`${loan.start_date}T00:00:00Z`),
          interestMethod: loan.interest_method,
          repaymentType: loan.repayment_type,
          afterMaturity: loan.after_maturity,
          graceDays: loan.grace_days,
          customSchedule: loan.customSchedule,
        },
        activePayments(loan, now),
      )
      for (const a of allocs) {
        if (isWithinInterval(a.paidOn, { start: yearStart, end: now })) {
          interestThisYear += Number(a.toInterest.toFixed(2))
        }
        if (isWithinInterval(a.paidOn, { start: monthStart, end: now })) {
          interestThisMonth += Number(a.toInterest.toFixed(2))
          collectionsThisMonth += Number(a.amount.toFixed(2))
        }
      }
    } catch {}

    for (const p of loan.payments) {
      if (p.deleted_at) continue
      recentPayments.push({
        loanId: loan.id,
        borrower: loan.borrower_name,
        paidOn: p.paid_on,
        amount: p.amount,
        method: p.method as PaymentMethod,
      })
    }
  }

  upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  recentPayments.sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1))
  const recent = recentPayments.slice(0, 5)

  const hasAnyLoans = loans.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Portfolio overview. Numbers recompute from your loans and payments on every load.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/borrowers/new">
            <Button variant="outline">New borrower</Button>
          </Link>
          <Link href="/loans/new">
            <Button variant="outline">New loan</Button>
          </Link>
          <GlobalLogPaymentButton />
        </div>
      </div>

      {!hasAnyLoans ? (
        <Card className="border-primary/30 from-primary/5 to-transparent bg-gradient-to-br">
          <CardContent className="flex flex-col items-start gap-4 py-8">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <Sparkles className="size-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight">
                Welcome to Loan Tracker
              </div>
              <p className="text-muted-foreground max-w-lg text-sm">
                Get started in two steps: add a borrower, then log their loan. Balances,
                schedules, and reports will populate the moment you do.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/borrowers/new">
                <Button>Add your first borrower</Button>
              </Link>
              <Link href="/loans/new">
                <Button variant="outline">Skip to new loan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Active loans" value={String(activeCount)} />
        <Tile label="Principal lent" value={formatPHP(totalPrincipalActive)} />
        <Tile label="Total outstanding" value={formatPHP(totalOutstanding)} />
        <Tile
          label="Overdue"
          value={String(overdueCount)}
          hint={overdueCount > 0 ? formatPHP(overdueAmount) : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Interest this month" value={formatPHP(interestThisMonth)} />
        <Tile label="Interest this year" value={formatPHP(interestThisYear)} />
        <Tile label="Interest earned all time" value={formatPHP(interestAllTime)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tile label="Collections this month" value={formatPHP(collectionsThisMonth)} full />
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Due in the next 7 days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground">Nothing due this week.</p>
            ) : (
              upcoming.slice(0, 5).map((u) => (
                <div key={u.loanId} className="flex justify-between gap-3">
                  <Link href={`/loans/${u.loanId}`} className="hover:underline">
                    {u.borrower}
                  </Link>
                  <div className="text-muted-foreground text-right">
                    <div>{formatDate(u.dueDate)}</div>
                    <div className="tabular-nums">{formatPHP(u.amount)}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Recent payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments logged yet.</p>
          ) : (
            <div className="divide-y">
              {recent.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/loans/${p.loanId}`} className="hover:underline">
                    {p.borrower}
                  </Link>
                  <div className="text-muted-foreground flex items-center gap-4 text-right">
                    <span>{format(new Date(p.paidOn), 'MMM d')}</span>
                    <span>{paymentMethodLabels[p.method]}</span>
                    <span className="tabular-nums">{formatPHP(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {overdueCount > 0 ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive text-base">
              {overdueCount} loan{overdueCount === 1 ? '' : 's'} overdue · {formatPHP(overdueAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="divide-y">
              {overdueLoans
                .slice()
                .sort((a, b) => b.daysPastDue - a.daysPastDue)
                .slice(0, 5)
                .map((o) => (
                  <div key={o.loanId} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/loans/${o.loanId}`} className="font-medium hover:underline">
                      {o.borrower}
                    </Link>
                    <div className="text-muted-foreground flex items-center gap-4 text-right">
                      <span className="tabular-nums">
                        {o.daysPastDue} day{o.daysPastDue === 1 ? '' : 's'} past due
                      </span>
                      <span className="text-foreground tabular-nums">{formatPHP(o.amount)}</span>
                    </div>
                  </div>
                ))}
            </div>
            {overdueLoans.length > 5 ? (
              <Link href="/reports/aging" className="text-sm underline">
                See all {overdueLoans.length} in the aging report →
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Tile({
  label,
  value,
  hint,
  full,
}: {
  label: string
  value: string
  hint?: string
  full?: boolean
}) {
  return (
    <Card className={full ? 'sm:col-span-1' : undefined}>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {hint ? <div className="text-muted-foreground mt-1 text-sm tabular-nums">{hint}</div> : null}
      </CardContent>
    </Card>
  )
}
