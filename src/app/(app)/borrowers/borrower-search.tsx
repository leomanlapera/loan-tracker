'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
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

type SortKey = 'name' | 'contact' | 'activeLoanCount' | 'outstanding' | 'status'

export function BorrowerSearch({ rows }: { rows: BorrowerRow[] }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortState<SortKey> | null>({
    key: 'name',
    direction: 'asc',
  })

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const base = query
      ? rows.filter((r) =>
          [r.fullName, r.mobile ?? '', r.email ?? ''].some((f) =>
            f.toLowerCase().includes(query),
          ),
        )
      : rows
    if (!sort) return base
    return [...base].sort((a, b) =>
      compareBy(a, b, (r) => sortValue(r, sort.key), sort.direction),
    )
  }, [rows, q, sort])

  const onSort = (key: SortKey) => setSort((s) => toggleSort(s, key))

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyState
          icon={Users}
          title="No borrowers yet"
          description="Add the people you lend to — you can log loans and payments once they're on file."
          action={
            <Link href="/borrowers/new">
              <Button>Add borrower</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <SearchWithHint
        placeholder="Search by name, mobile, or email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader columnKey="name" currentSort={sort} onSort={onSort}>
                  Name
                </SortableHeader>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="activeLoanCount"
                  currentSort={sort}
                  onSort={onSort}
                  align="right"
                >
                  Active loans
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="outstanding"
                  currentSort={sort}
                  onSort={onSort}
                  align="right"
                >
                  Outstanding
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                  No borrowers match that search.
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

function sortValue(r: BorrowerRow, key: SortKey): string | number | null {
  switch (key) {
    case 'name':
      return r.fullName.toLowerCase()
    case 'contact':
      return (r.mobile || r.email || '').toLowerCase()
    case 'activeLoanCount':
      return r.activeLoanCount
    case 'outstanding':
      return Number(r.totalOutstanding)
    case 'status':
      return r.archivedAt ? 'archived' : 'active'
  }
}
