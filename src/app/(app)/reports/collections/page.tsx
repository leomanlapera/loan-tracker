import Link from 'next/link'
import { format, startOfMonth, endOfMonth } from 'date-fns'
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
import {
  bucketize,
  collectionsInRange,
  type GroupBy,
} from '@/lib/reports/collections'
import { formatPHP } from '@/lib/format'
import { PAYMENT_METHODS, paymentMethodLabels } from '@/lib/validation/payment'
import { GroupBySelect } from './group-by-select'

export default async function CollectionsReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const range = parseDateRange(params, {
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })
  const rawGroupBy = typeof params.groupBy === 'string' ? params.groupBy : 'month'
  const groupBy: GroupBy = (['day', 'week', 'month'] as const).includes(rawGroupBy as GroupBy)
    ? (rawGroupBy as GroupBy)
    : 'month'

  const loans = await loadAllLoans()
  const payments = collectionsInRange(loans, range.from, range.to)
  const rows = bucketize(payments, groupBy)
  const grandTotal = rows.reduce((s, r) => s + r.total, 0)
  const perMethodTotals = PAYMENT_METHODS.reduce(
    (acc, m) => ({
      ...acc,
      [m]: rows.reduce((s, r) => s + (r.perMethod[m] ?? 0), 0),
    }),
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-muted-foreground text-sm hover:underline">
          ← Reports
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="text-sm text-muted-foreground">
          Payments received in the range, grouped by day, week, or month, and broken down by method.
        </p>
      </div>

      <DateRangeForm
        initialFrom={range.from}
        initialTo={range.to}
        exportPath="/reports/collections/export"
        extraFilters={<GroupBySelect value={groupBy} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {payments.length} payment{payments.length === 1 ? '' : 's'} · {formatPHP(grandTotal)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  {PAYMENT_METHODS.map((m) => (
                    <TableHead key={m} className="text-right">
                      {paymentMethodLabels[m]}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={PAYMENT_METHODS.length + 3}
                      className="text-muted-foreground py-6 text-center text-sm"
                    >
                      No collections in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.bucket}>
                      <TableCell>{r.bucket}</TableCell>
                      {PAYMENT_METHODS.map((m) => (
                        <TableCell key={m} className="text-right tabular-nums">
                          {r.perMethod[m] > 0 ? formatPHP(r.perMethod[m]) : '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatPHP(r.total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {rows.length > 0 ? (
                <TableBody>
                  <TableRow className="border-t">
                    <TableCell className="font-medium">Total</TableCell>
                    {PAYMENT_METHODS.map((m) => (
                      <TableCell key={m} className="text-right tabular-nums font-medium">
                        {perMethodTotals[m] > 0 ? formatPHP(perMethodTotals[m]) : '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatPHP(grandTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {payments.length}
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : null}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
