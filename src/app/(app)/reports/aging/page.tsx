import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { loadAllLoans } from '@/lib/reports/loans'
import { agingRows, bucketTotals, AGING_BUCKETS } from '@/lib/reports/aging'
import { formatPHP } from '@/lib/format'

export default async function AgingReport({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const asOfIso = typeof params.asOf === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.asOf)
    ? params.asOf
    : format(new Date(), 'yyyy-MM-dd')
  const asOf = new Date(`${asOfIso}T23:59:59Z`)

  const loans = await loadAllLoans()
  const rows = agingRows(loans, asOf)
  const totals = bucketTotals(rows)
  const grand = AGING_BUCKETS.reduce((s, b) => s + totals[b], 0)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-muted-foreground text-sm hover:underline">
          ← Reports
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aging / overdue</h1>
        <p className="text-sm text-muted-foreground">
          Loans with at least one period past due (after the grace period), bucketed by the oldest
          days past due.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border p-3">
        <div className="space-y-1">
          <label htmlFor="asOf" className="text-xs">
            As of
          </label>
          <input
            id="asOf"
            name="asOf"
            type="date"
            defaultValue={asOfIso}
            className="border-input rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="border-input rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Apply
        </button>
        <a
          href={`/reports/aging/export?asOf=${asOfIso}`}
          className="ml-auto bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
        >
          Download CSV
        </a>
      </form>

      <div className="grid gap-4 sm:grid-cols-4">
        {AGING_BUCKETS.map((b) => (
          <Card key={b}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {b} days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{formatPHP(totals[b])}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {rows.length} loan{rows.length === 1 ? '' : 's'} overdue · Total {formatPHP(grand)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Bucket</TableHead>
                  <TableHead className="text-right">Days past due</TableHead>
                  <TableHead className="text-right">Overdue amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground py-6 text-center text-sm">
                      Nothing overdue. Nice.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.loanId}>
                      <TableCell>
                        <Link href={`/loans/${r.loanId}`} className="hover:underline">
                          {r.borrower}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{r.bucket}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.daysPastDue}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(r.amount)}</TableCell>
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
