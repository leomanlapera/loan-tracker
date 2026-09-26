'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatPHP, formatRate } from '@/lib/format'

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
}

export function LoansTable({ rows }: { rows: LoanRow[] }) {
  const [q, setQ] = useState('')
  const [showClosed, setShowClosed] = useState(false)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (!showClosed && (r.status === 'paid' || r.status === 'cancelled' || r.status === 'written_off')) return false
      if (!query) return true
      return (
        r.borrowerName.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query)
      )
    })
  }, [rows, q, showClosed])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by borrower or status"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
          />
          Show closed
        </label>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Borrower</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Next due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-6 text-center text-sm">
                  {rows.length === 0
                    ? 'No loans yet. Create a borrower first, then a loan.'
                    : 'No loans match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/loans/${r.id}`} className="font-medium hover:underline">
                      {r.borrowerName}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(r.startDate)}</TableCell>
                  <TableCell className="tabular-nums">{formatPHP(r.principal)}</TableCell>
                  <TableCell className="tabular-nums">{formatRate(Number(r.monthlyRate))}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPHP(r.currentBalance)}</TableCell>
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
                      <Badge variant="outline">{r.status}</Badge>
                      {r.isOverdue ? <Badge variant="destructive">overdue</Badge> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
