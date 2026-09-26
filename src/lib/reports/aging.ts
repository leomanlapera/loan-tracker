import { differenceInCalendarDays, addDays } from 'date-fns'
import type { LoanDataRow } from './loans'
import { summarizeAt } from './loans'

export const AGING_BUCKETS = ['1-30', '31-60', '61-90', '90+'] as const
export type AgingBucket = (typeof AGING_BUCKETS)[number]

export interface AgingRow {
  loanId: string
  borrower: string
  bucket: AgingBucket
  daysPastDue: number
  amount: number
  status: string
}

function bucketFor(days: number): AgingBucket | null {
  if (days <= 0) return null
  if (days <= 30) return '1-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export function agingRows(loans: LoanDataRow[], asOf: Date): AgingRow[] {
  const rows: AgingRow[] = []
  for (const loan of loans) {
    if (loan.status !== 'active') continue
    const summary = summarizeAt(loan, asOf)
    if (!summary) continue

    let worstBucket: AgingBucket | null = null
    let maxDays = 0
    let unpaidTotal = 0
    for (const period of summary.schedule) {
      if (!period.isOverdue) continue
      const gracedDue = addDays(period.dueDate, loan.grace_days)
      const days = differenceInCalendarDays(asOf, gracedDue)
      const bucket = bucketFor(days)
      if (!bucket) continue
      const shortfall = Number(period.scheduledPayment.minus(period.actualPayment).toFixed(2))
      if (shortfall <= 0) continue
      unpaidTotal += shortfall
      if (days > maxDays) {
        maxDays = days
        worstBucket = bucket
      }
    }

    if (worstBucket && unpaidTotal > 0) {
      rows.push({
        loanId: loan.id,
        borrower: loan.borrower_name,
        bucket: worstBucket,
        daysPastDue: maxDays,
        amount: unpaidTotal,
        status: loan.status,
      })
    }
  }
  return rows.sort((a, b) => b.daysPastDue - a.daysPastDue)
}

export function bucketTotals(rows: AgingRow[]): Record<AgingBucket, number> {
  const out: Record<AgingBucket, number> = { '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
  for (const r of rows) out[r.bucket] += r.amount
  return out
}
