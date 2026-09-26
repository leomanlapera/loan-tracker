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
import { Badge } from '@/components/ui/badge'
import { DateRangeForm } from '@/components/reports/date-range-form'
import { loadAllLoans, summarizeAt } from '@/lib/reports/loans'
import { parseDateRange } from '@/lib/reports/date-range'
import { formatDate, formatPHP, formatRate } from '@/lib/format'
import { interestMethodLabel, loanStatusLabel } from '@/lib/labels'

export default async function PortfolioReport({
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
  const asOf = range.toDate

  const rows = loans
    .filter((l) => l.start_date <= range.to)
    .map((l) => {
      const summary = summarizeAt(l, asOf)
      return {
        loan: l,
        balance: summary ? Number(summary.currentBalance.toFixed(2)) : 0,
        totalPaid: summary ? Number(summary.totalPaid.toFixed(2)) : 0,
        interestEarned: summary ? Number(summary.interestEarnedToDate.toFixed(2)) : 0,
      }
    })

  const totals = rows.reduce(
    (acc, r) => ({
      balance: acc.balance + r.balance,
      totalPaid: acc.totalPaid + r.totalPaid,
      interest: acc.interest + r.interestEarned,
    }),
    { balance: 0, totalPaid: 0, interest: 0 },
  )

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[{ href: '/reports', label: 'Reports' }, { label: 'Portfolio summary' }]}
        />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio summary</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot as of the end of the date range.
        </p>
      </div>
      <DateRangeForm
        initialFrom={range.from}
        initialTo={range.to}
        exportPath="/reports/portfolio/export"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {rows.length} loan{rows.length === 1 ? '' : 's'} · Outstanding {formatPHP(totals.balance)} ·
            Interest earned {formatPHP(totals.interest)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Total paid</TableHead>
                  <TableHead className="text-right">Interest earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground py-6 text-center text-sm">
                      No loans in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(({ loan, balance, totalPaid, interestEarned }) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <Link href={`/loans/${loan.id}`} className="hover:underline">
                          {loan.borrower_name}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(loan.start_date)}</TableCell>
                      <TableCell className="tabular-nums">{formatPHP(loan.principal)}</TableCell>
                      <TableCell className="tabular-nums">{formatRate(loan.monthly_rate)}</TableCell>
                      <TableCell>{interestMethodLabel(loan.interest_method)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{loanStatusLabel(loan.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(balance)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(totalPaid)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPHP(interestEarned)}</TableCell>
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
