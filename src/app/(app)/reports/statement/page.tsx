import Link from 'next/link'
import { BackLink } from '@/components/back-link'
import { format, startOfYear } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { parseDateRange } from '@/lib/reports/date-range'
import { loadAllLoans, summarizeAt } from '@/lib/reports/loans'
import { formatDate, formatPHP, formatRate } from '@/lib/format'
import {
  interestMethodLabel,
  loanStatusLabel,
  periodStatusLabel,
  repaymentTypeLabel,
} from '@/lib/labels'
import { paymentMethodLabels, type PaymentMethod } from '@/lib/validation/payment'
import { StatementFilterForm } from './filter-form'

export default async function StatementReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: borrowers = [] } = await supabase
    .from('borrowers')
    .select('id, full_name')
    .order('full_name')

  const range = parseDateRange(params, {
    from: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  })
  const borrowerId = typeof params.borrowerId === 'string' ? params.borrowerId : undefined

  const loans = borrowerId
    ? (await loadAllLoans()).filter((l) => l.borrower_id === borrowerId)
    : []

  // For the print letterhead we want the full borrower record + the lender's
  // display name. Both are cheap point lookups; skip when no borrower chosen.
  const [borrowerDetail, lenderProfile] = borrowerId
    ? await Promise.all([
        supabase
          .from('borrowers')
          .select('full_name, mobile, email, address')
          .eq('id', borrowerId)
          .maybeSingle(),
        supabase.auth.getUser().then(async ({ data }) =>
          data.user
            ? supabase
                .from('profiles')
                .select('display_name')
                .eq('id', data.user.id)
                .maybeSingle()
            : { data: null },
        ),
      ])
    : [{ data: null }, { data: null }]
  const borrower = borrowerDetail?.data ?? null
  const lenderName = lenderProfile?.data?.display_name ?? null
  const generatedOn = format(new Date(), 'MMMM d, yyyy')

  return (
    <div className="print-doc space-y-6">
      <div className="print-hide">
        <BackLink href="/reports">Reports</BackLink>
      </div>
      <div className="print-hide">
        <h1 className="text-2xl font-semibold tracking-tight">Borrower statement</h1>
        <p className="text-sm text-muted-foreground">
          Full schedule and payment history for a single borrower.
        </p>
      </div>

      <StatementFilterForm
        borrowers={(borrowers ?? []).map((b) => ({ id: b.id, name: b.full_name }))}
        initialBorrowerId={borrowerId ?? ''}
        initialFrom={range.from}
        initialTo={range.to}
      />

      {borrowerId && borrower ? (
        <header className="hidden print:block">
          <div className="flex items-start justify-between gap-6 border-b border-black pb-3">
            <div>
              <div className="text-xs uppercase tracking-widest">Borrower statement</div>
              <div className="mt-1 text-lg font-semibold">{borrower.full_name}</div>
              <div className="text-xs">
                {[borrower.mobile, borrower.email].filter(Boolean).join(' · ') || '—'}
              </div>
              {borrower.address ? (
                <div className="text-xs whitespace-pre-line">{borrower.address}</div>
              ) : null}
            </div>
            <div className="text-right text-xs">
              {lenderName ? <div className="font-semibold text-sm">{lenderName}</div> : null}
              <div>Generated {generatedOn}</div>
              <div>
                Period {formatDate(range.from)} – {formatDate(range.to)}
              </div>
            </div>
          </div>
        </header>
      ) : null}

      {!borrowerId ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Choose a borrower to render the statement.
          </CardContent>
        </Card>
      ) : loans.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            No loans for this borrower.
          </CardContent>
        </Card>
      ) : (
        loans.map((loan, idx) => {
          const summary = summarizeAt(loan, range.toDate)
          const paymentsInRange = loan.payments
            .filter((p) => !p.deleted_at && p.paid_on >= range.from && p.paid_on <= range.to)
            .sort((a, b) => (a.paid_on < b.paid_on ? 1 : -1))
          return (
            <Card
              key={loan.id}
              data-print-card
              {...(idx > 0 ? { 'data-print-page-break': true } : {})}
            >
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href={`/loans/${loan.id}`} className="hover:underline">
                    Loan from {formatDate(loan.start_date)} · {formatPHP(loan.principal)} @{' '}
                    {formatRate(loan.monthly_rate)}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline">{loanStatusLabel(loan.status)}</Badge>
                  <Badge variant="outline">{interestMethodLabel(loan.interest_method)}</Badge>
                  <Badge variant="outline">{repaymentTypeLabel(loan.repayment_type)}</Badge>
                  {summary ? (
                    <span className="text-muted-foreground">
                      Balance {formatPHP(summary.currentBalance.toFixed(2))} · Paid{' '}
                      {formatPHP(summary.totalPaid.toFixed(2))}
                    </span>
                  ) : null}
                </div>

                <section className="space-y-2">
                  <div className="text-sm font-medium">Schedule</div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead className="text-right">Interest</TableHead>
                          <TableHead className="text-right">Scheduled</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Closing</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(summary?.schedule ?? []).map((r) => (
                          <TableRow key={r.period}>
                            <TableCell className="tabular-nums text-muted-foreground">{r.period}</TableCell>
                            <TableCell>{formatDate(r.dueDate)}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatPHP(r.interestAccrued.toFixed(2))}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.scheduledPayment.gt(0) ? formatPHP(r.scheduledPayment.toFixed(2)) : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.actualPayment.gt(0) ? formatPHP(r.actualPayment.toFixed(2)) : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatPHP(r.closingBalance.toFixed(2))}
                            </TableCell>
                            <TableCell>{periodStatusLabel(r.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                <section className="space-y-2">
                  <div className="text-sm font-medium">Payments in range</div>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Ref / note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsInRange.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground py-4 text-center text-sm">
                              No payments in range.
                            </TableCell>
                          </TableRow>
                        ) : (
                          paymentsInRange.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{formatDate(p.paid_on)}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatPHP(p.amount)}
                              </TableCell>
                              <TableCell>{paymentMethodLabels[p.method as PaymentMethod]}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {p.reference_no || p.note || '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
