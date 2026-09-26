import { format, startOfWeek, startOfMonth, startOfDay, parseISO } from 'date-fns'
import type { LoanDataRow, PaymentRecord } from './loans'
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/validation/payment'

export type GroupBy = 'day' | 'week' | 'month'

export interface CollectionsRow {
  bucket: string
  total: number
  perMethod: Record<PaymentMethod, number>
  count: number
}

const emptyPerMethod = (): Record<PaymentMethod, number> => {
  const out = {} as Record<PaymentMethod, number>
  for (const m of PAYMENT_METHODS) out[m] = 0
  return out
}

export function bucketOf(iso: string, groupBy: GroupBy): string {
  const d = parseISO(iso)
  if (groupBy === 'day') return format(startOfDay(d), 'yyyy-MM-dd')
  if (groupBy === 'week') return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-'W'II")
  return format(startOfMonth(d), 'yyyy-MM')
}

export function collectionsInRange(
  loans: LoanDataRow[],
  from: string,
  to: string,
): PaymentRecord[] {
  const out: PaymentRecord[] = []
  for (const loan of loans) {
    for (const p of loan.payments) {
      if (p.deleted_at) continue
      if (p.paid_on < from || p.paid_on > to) continue
      out.push(p)
    }
  }
  return out.sort((a, b) => (a.paid_on < b.paid_on ? -1 : 1))
}

export function bucketize(
  payments: PaymentRecord[],
  groupBy: GroupBy,
): CollectionsRow[] {
  const map = new Map<string, CollectionsRow>()
  for (const p of payments) {
    const key = bucketOf(p.paid_on, groupBy)
    let row = map.get(key)
    if (!row) {
      row = { bucket: key, total: 0, perMethod: emptyPerMethod(), count: 0 }
      map.set(key, row)
    }
    row.total += p.amount
    row.perMethod[p.method as PaymentMethod] = (row.perMethod[p.method as PaymentMethod] ?? 0) + p.amount
    row.count += 1
  }
  return Array.from(map.values()).sort((a, b) => (a.bucket < b.bucket ? -1 : 1))
}
