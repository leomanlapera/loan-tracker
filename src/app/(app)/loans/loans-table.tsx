'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchWithHint } from '@/components/search-with-hint'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  SortableHeader,
  compareBy,
  toggleSort,
  type SortState,
} from '@/components/ui/sortable-header'
import { EmptyState } from '@/components/empty-state'
import { Sparkline } from '@/components/ui/sparkline'
import { formatDate, formatPHP, formatRate } from '@/lib/format'
import { loanStatusLabel } from '@/lib/labels'
import { LoanRowActions } from './loan-row-actions'

export interface LoanRow {
  id: string
  borrowerId: string
  borrowerName: string
  principal: string
  monthlyRate: string
  status: string
  startDate: string
  currentBalance: string
  nextDueDate: string | null
  nextDueAmount: string
  isOverdue: boolean
  balanceHistory: number[]
}

type SortKey =
  | 'borrower'
  | 'startDate'
  | 'principal'
  | 'rate'
  | 'balance'
  | 'nextDue'
  | 'status'

export function LoansTable({ rows }: { rows: LoanRow[] }) {
  const [q, setQ] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [sort, setSort] = useState<SortState<SortKey> | null>({
    key: 'nextDue',
    direction: 'asc',
  })

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const base = rows.filter((r) => {
      if (
        !showClosed &&
        (r.status === 'paid' || r.status === 'cancelled' || r.status === 'written_off')
      )
        return false
      if (!query) return true
      return (
        r.borrowerName.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query)
      )
    })
    if (!sort) return base
    return [...base].sort((a, b) =>
      compareBy(a, b, (r) => sortValue(r, sort.key), sort.direction),
    )
  }, [rows, q, showClosed, sort])

  const onSort = (key: SortKey) => setSort((s) => toggleSort(s, key))

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyState
          icon={CreditCard}
          title="No loans yet"
          description="Log your first loan against a borrower. Balances, schedules, and reports appear as soon as you do."
          action={
            <Link href="/loans/new">
              <Button>New loan</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchWithHint
          placeholder="Search by borrower or status"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label
          htmlFor="show-closed"
          className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm select-none"
        >
          <Checkbox
            id="show-closed"
            checked={showClosed}
            onCheckedChange={(v) => setShowClosed(v === true)}
          />
          Show closed
        </label>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader columnKey="borrower" currentSort={sort} onSort={onSort}>
                  Borrower
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader columnKey="startDate" currentSort={sort} onSort={onSort}>
                  Start
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader columnKey="principal" currentSort={sort} onSort={onSort}>
                  Principal
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader columnKey="rate" currentSort={sort} onSort={onSort}>
                  Rate
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader columnKey="balance" currentSort={sort} onSort={onSort} align="right">
                  Balance
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader columnKey="nextDue" currentSort={sort} onSort={onSort}>
                  Next due
                </SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader columnKey="status" currentSort={sort} onSort={onSort}>
                  Status
                </SortableHeader>
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-6 text-center text-sm">
                  No loans match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const closed =
                  r.status === 'paid' || r.status === 'cancelled' || r.status === 'written_off'
                return (
                  <TableRow key={r.id} className="relative">
                    <TableCell>
                      <Link
                        href={`/loans/${r.id}`}
                        className="font-medium hover:underline after:absolute after:inset-0"
                      >
                        {r.borrowerName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(r.startDate)}</TableCell>
                    <TableCell className="tabular-nums">{formatPHP(r.principal)}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatRate(Number(r.monthlyRate))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex flex-col items-end gap-0.5">
                        <span>{formatPHP(r.currentBalance)}</span>
                        {r.balanceHistory.length >= 2 ? (
                          <Sparkline
                            points={r.balanceHistory}
                            width={72}
                            height={16}
                            ariaLabel={`Balance trend for ${r.borrowerName}`}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.nextDueDate ? (
                        <>
                          <div>{formatDate(r.nextDueDate)}</div>
                          <div className="text-muted-foreground text-xs tabular-nums">
                            {formatPHP(r.nextDueAmount)}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline">{loanStatusLabel(r.status)}</Badge>
                        {r.isOverdue ? <Badge variant="destructive">Overdue</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="relative z-10 inline-flex">
                        <LoanRowActions loanId={r.id} disabled={closed} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function sortValue(r: LoanRow, key: SortKey): string | number | null {
  switch (key) {
    case 'borrower':
      return r.borrowerName.toLowerCase()
    case 'startDate':
      return r.startDate
    case 'principal':
      return Number(r.principal)
    case 'rate':
      return Number(r.monthlyRate)
    case 'balance':
      return Number(r.currentBalance)
    case 'nextDue':
      return r.nextDueDate
    case 'status':
      return r.status
  }
}
