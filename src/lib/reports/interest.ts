import { format, parseISO, startOfMonth } from 'date-fns'
import type { LoanDataRow } from './loans'
import { toEngineLoan, activePayments } from './loans'
import { allocatePayments } from '@/lib/engine/allocate'

export interface InterestBucket {
  month: string
  interest: number
  principal: number
  total: number
  paymentCount: number
}

/**
 * Interest earned per calendar month = sum of the interest portion of every
 * payment whose paid_on falls in that month. Uses the per-payment allocation
 * helper so results match the schedule table exactly.
 */
export function interestByMonth(
  loans: LoanDataRow[],
  from: string,
  to: string,
): InterestBucket[] {
  const map = new Map<string, InterestBucket>()

  for (const loan of loans) {
    let allocs
    try {
      allocs = allocatePayments(toEngineLoan(loan), activePayments(loan))
    } catch {
      continue
    }
    for (const a of allocs) {
      const iso = format(a.paidOn, 'yyyy-MM-dd')
      if (iso < from || iso > to) continue
      const monthKey = format(startOfMonth(parseISO(iso)), 'yyyy-MM')
      let row = map.get(monthKey)
      if (!row) {
        row = { month: monthKey, interest: 0, principal: 0, total: 0, paymentCount: 0 }
        map.set(monthKey, row)
      }
      row.interest += Number(a.toInterest.toFixed(2))
      row.principal += Number(a.toPrincipal.toFixed(2))
      row.total += Number(a.amount.toFixed(2))
      row.paymentCount += 1
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.month < b.month ? -1 : 1))
}
