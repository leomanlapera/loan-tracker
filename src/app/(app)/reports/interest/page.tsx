import { BackLink } from '@/components/back-link'
import { format, startOfYear } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DateRangeForm } from '@/components/reports/date-range-form'
import { parseDateRange } from '@/lib/reports/date-range'
import { loadAllLoans } from '@/lib/reports/loans'
import { interestByMonth } from '@/lib/reports/interest'
import { formatPHP } from '@/lib/format'

export default async function InterestReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const range = parseDateRange(params, {
    from: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  })

  const loans = await loadAllLoans()
  const buckets = interestByMonth(loans, range.from, range.to)
  const totals = buckets.reduce(
    (acc, r) => ({
      interest: acc.interest + r.interest,
      principal: acc.principal + r.principal,
      total: acc.total + r.total,
      count: acc.count + r.paymentCount,
    }),
    { interest: 0, principal: 0, total: 0, count: 0 },
  )

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/reports">Reports</BackLink>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Interest income</h1>
        <p className="text-sm text-muted-foreground">
          Interest portion of every payment received, bucketed by calendar month.
        </p>
      </div>

      <DateRangeForm
        initialFrom={range.from}
        initialTo={range.to}
        exportPath="/reports/interest/export"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Interest {formatPHP(totals.interest)} · Principal {formatPHP(totals.principal)} ·{' '}
            Total received {formatPHP(totals.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                      No interest received in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  buckets.map((r) => (
                    <TableRow key={r.month}>
                      <TableCell>{r.month}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(r.interest)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(r.principal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(r.total)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.paymentCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
