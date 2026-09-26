import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
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
import { loadAllLoans, summarizeAt } from '@/lib/reports/loans'
import { formatDate, formatPHP } from '@/lib/format'

export default async function WriteOffsReport({
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
  const closedInRange = loans.filter((l) => {
    if (l.status !== 'written_off') return false
    if (!l.closed_at) return false
    const iso = l.closed_at.slice(0, 10)
    return iso >= range.from && iso <= range.to
  })

  const rows = closedInRange.map((l) => {
    const closedAt = l.closed_at ? new Date(l.closed_at) : range.toDate
    const summary = summarizeAt(l, closedAt)
    return {
      loan: l,
      loss: summary ? Number(summary.currentBalance.toFixed(2)) : 0,
      closedAt: l.closed_at,
    }
  })
  const totalLoss = rows.reduce((s, r) => s + r.loss, 0)

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[{ href: '/reports', label: 'Reports' }, { label: 'Write-offs' }]}
        />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Write-offs</h1>
        <p className="text-sm text-muted-foreground">
          Loans marked as written off within the date range. Loss is the outstanding balance at
          the time of write-off.
        </p>
      </div>

      <DateRangeForm
        initialFrom={range.from}
        initialTo={range.to}
        exportPath="/reports/write-offs/export"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {rows.length} write-off{rows.length === 1 ? '' : 's'} · Total loss {formatPHP(totalLoss)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Loss (balance at write-off)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                      No write-offs in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(({ loan, loss, closedAt }) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <Link href={`/loans/${loan.id}`} className="hover:underline">
                          {loan.borrower_name}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(loan.start_date)}</TableCell>
                      <TableCell>{closedAt ? formatDate(closedAt) : '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(loan.principal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(loss)}</TableCell>
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
