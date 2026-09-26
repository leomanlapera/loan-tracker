'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
import { formatPHP } from '@/lib/format'

export interface BorrowerRow {
  id: string
  fullName: string
  mobile: string | null
  email: string | null
  archivedAt: string | null
  activeLoanCount: number
  totalOutstanding: string
}

export function BorrowerSearch({ rows }: { rows: BorrowerRow[] }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((r) =>
      [r.fullName, r.mobile ?? '', r.email ?? ''].some((f) =>
        f.toLowerCase().includes(query),
      ),
    )
  }, [rows, q])

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name, mobile, or email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Active loans</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                  {rows.length === 0
                    ? 'No borrowers yet. Add one to get started.'
                    : 'No borrowers match that search.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/borrowers/${r.id}`} className="font-medium hover:underline">
                      {r.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.mobile || r.email || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.activeLoanCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPHP(r.totalOutstanding)}</TableCell>
                  <TableCell className="text-right">
                    {r.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
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
