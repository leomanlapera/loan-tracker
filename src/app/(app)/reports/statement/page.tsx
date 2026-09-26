import Link from 'next/link'
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
import { paymentMethodLabels, type PaymentMethod } from '@/lib/validation/payment'

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-muted-foreground text-sm hover:underline">
          ← Reports
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Borrower statement</h1>
        <p className="text-sm text-muted-foreground">
          Full schedule and payment history for a single borrower.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border p-3">
        <div className="space-y-1">
          <label htmlFor="borrowerId" className="text-xs font-medium">
            Borrower
          </label>
          <select
            id="borrowerId"
            name="borrowerId"
            defaultValue={borrowerId ?? ''}
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Choose a borrower</option>
            {(borrowers ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="from" className="text-xs">
            From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={range.from}
            className="border-input rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="to" className="text-xs">
            To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={range.to}
            className="border-input rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="border-input rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Apply
        </button>
        {borrowerId ? (
          <a
            href={`/reports/statement/export?borrowerId=${borrowerId}&from=${range.from}&to=${range.to}`}
            className="ml-auto bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
          >
            Download CSV
          </a>
        ) : null}
      </form>

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
        loans.map((loan) => {
          const summary = summarizeAt(loan, range.toDate)
          const paymentsInRange = loan.payments
            .filter((p) => !p.deleted_at && p.paid_on >= range.from && p.paid_on <= range.to)
            .sort((a, b) => (a.paid_on < b.paid_on ? 1 : -1))
          return (
            <Card key={loan.id}>
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
                  <Badge variant="outline">{loan.status}</Badge>
                  <Badge variant="outline">{loan.interest_method}</Badge>
                  <Badge variant="outline">{loan.repayment_type}</Badge>
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
                            <TableCell>{r.status}</TableCell>
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
