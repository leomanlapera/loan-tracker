import type { NextRequest } from 'next/server'
import { csvResponse, toCsv } from '@/lib/csv'
import { loadAllLoans } from '@/lib/reports/loans'
import { parseDateRange } from '@/lib/reports/date-range'
import { interestByMonth } from '@/lib/reports/interest'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const range = parseDateRange(params)
  const buckets = interestByMonth(await loadAllLoans(), range.from, range.to)
  const headers = ['month', 'interest', 'principal', 'total_received', 'payment_count']
  const rows = buckets.map((r) => [
    r.month,
    Number(r.interest.toFixed(2)),
    Number(r.principal.toFixed(2)),
    Number(r.total.toFixed(2)),
    r.paymentCount,
  ])
  return csvResponse(`interest_income_${range.from}_to_${range.to}.csv`, toCsv(headers, rows))
}
