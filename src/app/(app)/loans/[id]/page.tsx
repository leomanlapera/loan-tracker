import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { notFound } from 'next/navigation'
import { differenceInCalendarDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { compute } from '@/lib/engine/compute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/ui/copy-button'
import { formatDate, formatPHP, formatRate } from '@/lib/format'
import {
  interestMethodLabel,
  loanStatusLabel,
  repaymentTypeLabel,
} from '@/lib/labels'
import type {
  InterestMethod,
  RepaymentType,
  AfterMaturity,
  CustomScheduleEntry,
} from '@/lib/engine/types'
import { LoanActionBar } from './loan-action-bar'
import { RecentTracker } from '@/components/recent-tracker'
import { ScheduleTable } from './schedule-table'
import { PaymentLog, type PaymentRow } from './payment-log'
import { BalanceChart } from './balance-chart'
import type { PaymentMethod } from '@/lib/validation/payment'

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: loan } = await supabase
    .from('loans')
    .select(
      'id, borrower_id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status, notes, reference_no',
    )
    .eq('id', id)
    .maybeSingle()
  if (!loan) notFound()

  const [{ data: borrower }, { data: payments = [] }, { data: schedule = [] }] = await Promise.all(
    [
      supabase.from('borrowers').select('id, full_name').eq('id', loan.borrower_id).maybeSingle(),
      supabase
        .from('payments')
        .select('id, amount, paid_on, method, reference_no, note, deleted_at')
        .eq('loan_id', id)
        .order('paid_on', { ascending: false }),
      supabase
        .from('loan_custom_schedule')
        .select('period, planned_amount')
        .eq('loan_id', id)
        .order('period'),
    ],
  )

  const activePayments = (payments ?? []).filter((p) => !p.deleted_at)
  const activeCount = activePayments.length
  const lastPayment = activePayments[0] ?? null
  const customSchedule: CustomScheduleEntry[] | undefined =
    loan.repayment_type === 'custom'
      ? (schedule ?? []).map((s) => ({ period: s.period, plannedAmount: String(s.planned_amount) }))
      : undefined

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
        customSchedule,
      },
      payments: activePayments.map((p) => ({
        amount: Number(p.amount),
        paidOn: new Date(`${p.paid_on}T00:00:00Z`),
      })),
      asOf: now,
    })
  } catch {
    summary = null
  }

  const paymentRows: PaymentRow[] = (payments ?? []).map((p) => ({
    id: p.id,
    amount: String(p.amount),
    paidOn: p.paid_on,
    method: p.method as PaymentMethod,
    referenceNo: p.reference_no,
    note: p.note,
    deletedAt: p.deleted_at,
  }))

  const chartLoan = {
    principal: String(loan.principal),
    monthlyRate: String(loan.monthly_rate),
    tenureMonths: loan.tenure_months,
    startDate: loan.start_date,
    interestMethod: loan.interest_method as InterestMethod,
    repaymentType: loan.repayment_type as RepaymentType,
    afterMaturity: loan.after_maturity as AfterMaturity,
    graceDays: loan.grace_days,
    customSchedule,
  }
  const chartPayments = activePayments.map((p) => ({
    amount: String(p.amount),
    paidOn: p.paid_on,
  }))

  return (
    <div className="space-y-6">
      <RecentTracker
        href={`/loans/${loan.id}`}
        label={borrower?.full_name ?? 'Loan'}
        hint={`Loan · ${formatPHP(Number(loan.principal))} @ ${formatRate(Number(loan.monthly_rate))}`}
        kind="loan"
      />
      <Breadcrumbs
        items={[
          { href: '/loans', label: 'Loans' },
          { label: borrower?.full_name ?? 'Loan' },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {borrower ? (
              <Link href={`/borrowers/${borrower.id}`} className="hover:underline">
                {borrower.full_name}
              </Link>
            ) : (
              'Loan'
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Started {formatDate(loan.start_date)} · {formatPHP(Number(loan.principal))} @{' '}
            {formatRate(Number(loan.monthly_rate))} · {loan.tenure_months} months
          </p>
          {lastPayment ? (
            <p className="text-sm text-muted-foreground mt-1">
              Last payment {formatDate(lastPayment.paid_on)} ·{' '}
              <span className="tabular-nums">{formatPHP(Number(lastPayment.amount))}</span>
              {' · '}
              {daysAgoLabel(lastPayment.paid_on, now)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">No payments logged yet.</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{loanStatusLabel(loan.status)}</Badge>
            <Badge variant="outline">{interestMethodLabel(loan.interest_method)}</Badge>
            <Badge variant="outline">{repaymentTypeLabel(loan.repayment_type)}</Badge>
            <span className="text-muted-foreground ml-1 inline-flex items-center gap-1 text-xs">
              <span className="font-mono">ID {loan.id.slice(0, 8)}</span>
              <CopyButton value={loan.id} label="Loan ID" />
            </span>
          </div>
        </div>
        <LoanActionBar loanId={loan.id} status={loan.status} disableCancel={activeCount > 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Current balance"
          value={summary ? formatPHP(summary.currentBalance.toFixed(2)) : '—'}
        />
        <Tile
          label="Total paid"
          value={summary ? formatPHP(summary.totalPaid.toFixed(2)) : '—'}
        />
        <Tile
          label="Interest earned"
          value={summary ? formatPHP(summary.interestEarnedToDate.toFixed(2)) : '—'}
        />
        <Tile
          label={summary?.nextDueDate ? 'Next due' : 'Payoff amount'}
          value={
            summary?.nextDueDate
              ? formatDate(summary.nextDueDate)
              : summary
                ? formatPHP(summary.payoffAmount.toFixed(2))
                : '—'
          }
          hint={
            summary?.nextDueDate ? formatPHP(summary.nextDueAmount.toFixed(2)) : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <ScheduleTable rows={summary.schedule} />
          ) : (
            <p className="text-muted-foreground text-sm">Schedule unavailable.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentLog loanId={loan.id} payments={paymentRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balance over time — compound vs simple</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceChart loan={chartLoan} payments={chartPayments} />
          <p className="text-muted-foreground mt-3 text-xs">
            Both curves use the same payment set. The solid line is this loan&apos;s method; the
            dashed line projects the other method for comparison.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function daysAgoLabel(paidOn: string, now: Date): string {
  const days = differenceInCalendarDays(now, new Date(`${paidOn}T00:00:00Z`))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
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
