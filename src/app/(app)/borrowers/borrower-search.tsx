'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { bulkArchiveBorrowers } from './actions'

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
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortState<SortKey> | null>({
    key: 'name',
    direction: 'asc',
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

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

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const visibleIds = filtered.map((r) => r.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selected.has(id))

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) visibleIds.forEach((id) => next.add(id))
      else visibleIds.forEach((id) => next.delete(id))
      return next
    })
  }

  const runBulkArchive = (archive: boolean) => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    startTransition(async () => {
      const r = await bulkArchiveBorrowers(ids, archive)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(
        `${archive ? 'Archived' : 'Unarchived'} ${r.count ?? ids.length} borrower${
          (r.count ?? ids.length) === 1 ? '' : 's'
        }`,
      )
      setSelected(new Set())
      router.refresh()
    })
  }

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
      {selected.size > 0 ? (
        <div className="bg-muted/60 flex flex-wrap items-center gap-3 rounded-md border p-2 pl-3 text-sm">
          <span className="text-muted-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => runBulkArchive(true)}
            >
              Archive selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => runBulkArchive(false)}
            >
              Unarchive selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label={allVisibleSelected ? 'Deselect all' : 'Select all'}
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  onCheckedChange={(v) => toggleAllVisible(v === true)}
                />
              </TableHead>
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
                <TableCell colSpan={6} className="text-muted-foreground py-6 text-center text-sm">
                  No borrowers match that search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="relative">
                  <TableCell className="w-10">
                    <div className="relative z-10 inline-flex">
                      <Checkbox
                        aria-label={`Select ${r.fullName}`}
                        checked={selected.has(r.id)}
                        onCheckedChange={(v) => toggleOne(r.id, v === true)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/borrowers/${r.id}`}
                      className="font-medium hover:underline after:absolute after:inset-0"
                    >
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
