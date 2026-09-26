'use client'

import type { ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from 'cn'

export type SortDirection = 'asc' | 'desc'
export interface SortState<K extends string = string> {
  key: K
  direction: SortDirection
}

interface Props<K extends string> {
  columnKey: K
  currentSort: SortState<K> | null
  onSort: (key: K) => void
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

/**
 * Clickable table header cell content that toggles sort direction.
 * Wrap in a <TableHead> like:
 *   <TableHead><SortableHeader columnKey="balance" ...>Balance</SortableHeader></TableHead>
 */
export function SortableHeader<K extends string>({
  columnKey,
  currentSort,
  onSort,
  children,
  align = 'left',
  className,
}: Props<K>) {
  const active = currentSort?.key === columnKey
  const Icon = active ? (currentSort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={cn(
        'hover:text-foreground -mx-2 flex items-center gap-1.5 rounded px-2 py-1 transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground',
        align === 'right' && 'ml-auto',
        className,
      )}
      aria-label={`Sort by ${typeof children === 'string' ? children : columnKey}`}
    >
      <span>{children}</span>
      <Icon className={cn('size-3', active ? 'opacity-100' : 'opacity-50')} aria-hidden />
    </button>
  )
}

export function toggleSort<K extends string>(
  current: SortState<K> | null,
  key: K,
  defaultDirection: SortDirection = 'asc',
): SortState<K> {
  if (current?.key !== key) return { key, direction: defaultDirection }
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
}

export function compareBy<T>(
  a: T,
  b: T,
  get: (row: T) => number | string | null | undefined,
  direction: SortDirection,
): number {
  const av = get(a)
  const bv = get(b)
  // Nulls always sort last.
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
  return direction === 'asc' ? cmp : -cmp
}
