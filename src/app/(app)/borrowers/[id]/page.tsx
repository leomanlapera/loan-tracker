import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BorrowerForm } from '../borrower-form'
import { BorrowerActions } from './borrower-actions'
import { RecentTracker } from '@/components/recent-tracker'
import { CopyButton } from '@/components/ui/copy-button'
import { formatDate, formatPHP, formatRate } from '@/lib/format'
import { loanStatusLabel } from '@/lib/labels'
import { summarize } from '@/lib/engine/loan-summary'
import type { InterestMethod, RepaymentType, AfterMaturity } from '@/lib/engine/types'

export default async function BorrowerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: borrower } = await supabase
    .from('borrowers')
    .select('id, full_name, mobile, email, address, notes, archived_at')
    .eq('id', id)
    .maybeSingle()
  if (!borrower) notFound()

  const { data: loans = [] } = await supabase
    .from('loans')
    .select(
      'id, principal, monthly_rate, tenure_months, start_date, interest_method, repayment_type, after_maturity, grace_days, status',
    )
    .eq('borrower_id', id)
    .order('start_date', { ascending: false })

  const loanIds = (loans ?? []).map((l) => l.id)
  const paymentsMap = new Map<string, { amount: number; paid_on: string }[]>()
  if (loanIds.length) {
    const { data: payments = [] } = await supabase
      .from('payments')
      .select('loan_id, amount, paid_on')
      .is('deleted_at', null)
      .in('loan_id', loanIds)
    for (const p of payments ?? []) {
      const list = paymentsMap.get(p.loan_id) ?? []
      list.push({ amount: Number(p.amount), paid_on: p.paid_on })
      paymentsMap.set(p.loan_id, list)
    }
  }

  const now = new Date()
  const enriched = (loans ?? []).map((loan) => {
    const summary = summarize(
      {
        principal: Number(loan.principal),
        monthlyRate: Number(loan.monthly_rate),
        tenureMonths: loan.tenure_months,
        startDate: new Date(`${loan.start_date}T00:00:00Z`),
        interestMethod: loan.interest_method as InterestMethod,
        repaymentType: loan.repayment_type as RepaymentType,
        afterMaturity: loan.after_maturity as AfterMaturity,
        graceDays: loan.grace_days,
      },
      (paymentsMap.get(loan.id) ?? []).map((p) => ({
        amount: p.amount,
        paidOn: new Date(`${p.paid_on}T00:00:00Z`),
      })),
      now,
    )
    return { loan, summary }
  })

  const activeLoanCount = enriched.filter((l) => l.loan.status === 'active').length

  return (
    <div className="print-doc space-y-6">
      <RecentTracker
        href={`/borrowers/${borrower.id}`}
        label={borrower.full_name}
        hint="Borrower"
        kind="borrower"
      />
      <div className="print-hide">
        <Breadcrumbs
          items={[
            { href: '/borrowers', label: 'Borrowers' },
            { label: borrower.full_name },
          ]}
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{borrower.full_name}</h1>
          {borrower.mobile || borrower.email ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {borrower.mobile ? (
                <div className="text-muted-foreground inline-flex items-center gap-1">
                  <a
                    href={`tel:${borrower.mobile}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {borrower.mobile}
                  </a>
                  <CopyButton value={borrower.mobile} label="Phone" />
                </div>
              ) : null}
              {borrower.email ? (
                <div className="text-muted-foreground inline-flex items-center gap-1">
                  <a
                    href={`mailto:${borrower.email}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {borrower.email}
                  </a>
                  <CopyButton value={borrower.email} label="Email" />
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contact info</p>
          )}
          {borrower.archived_at ? (
            <Badge variant="outline" className="mt-2">
              Archived
            </Badge>
          ) : null}
        </div>
        <div className="print-hide">
          <BorrowerActions
            borrowerId={borrower.id}
            archived={!!borrower.archived_at}
            activeLoanCount={activeLoanCount}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {enriched.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
                <span>No loans yet.</span>
                <Link href={`/loans/new?borrowerId=${borrower.id}`}>
                  <Button size="sm">New loan</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enriched.map(({ loan, summary }) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <Link href={`/loans/${loan.id}`} className="hover:underline">
                            {formatDate(loan.start_date)}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular-nums">{formatPHP(Number(loan.principal))}</TableCell>
                        <TableCell className="tabular-nums">{formatRate(Number(loan.monthly_rate))}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {summary ? formatPHP(summary.currentBalance.toFixed(2)) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{loanStatusLabel(loan.status)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print-hide">
          <CardHeader>
            <CardTitle>Edit borrower</CardTitle>
          </CardHeader>
          <CardContent>
            <BorrowerForm
              mode="edit"
              borrowerId={borrower.id}
              initial={{
                fullName: borrower.full_name,
                mobile: borrower.mobile,
                email: borrower.email,
                address: borrower.address,
                notes: borrower.notes,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
