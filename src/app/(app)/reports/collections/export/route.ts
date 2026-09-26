import type { NextRequest } from 'next/server'
import { csvResponse, toCsv } from '@/lib/csv'
import { loadAllLoans } from '@/lib/reports/loans'
import { parseDateRange } from '@/lib/reports/date-range'
import { bucketize, collectionsInRange, type GroupBy } from '@/lib/reports/collections'
import { PAYMENT_METHODS } from '@/lib/validation/payment'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const range = parseDateRange(params)
  const rawGroupBy = typeof params.groupBy === 'string' ? params.groupBy : 'month'
  const groupBy: GroupBy = (['day', 'week', 'month'] as const).includes(rawGroupBy as GroupBy)
    ? (rawGroupBy as GroupBy)
    : 'month'

  const loans = await loadAllLoans()
  const payments = collectionsInRange(loans, range.from, range.to)
  const rows = bucketize(payments, groupBy)

  const headers = ['bucket', ...PAYMENT_METHODS, 'total', 'count']
  const csvRows = rows.map((r) => [
    r.bucket,
    ...PAYMENT_METHODS.map((m) => Number((r.perMethod[m] ?? 0).toFixed(2))),
    Number(r.total.toFixed(2)),
    r.count,
  ])

  return csvResponse(
    `collections_${groupBy}_${range.from}_to_${range.to}.csv`,
    toCsv(headers, csvRows),
  )
}
