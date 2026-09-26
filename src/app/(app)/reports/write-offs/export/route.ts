import type { NextRequest } from 'next/server'
import { csvResponse, toCsv } from '@/lib/csv'
import { loadAllLoans, summarizeAt } from '@/lib/reports/loans'
import { parseDateRange } from '@/lib/reports/date-range'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const range = parseDateRange(params)
  const loans = await loadAllLoans()

  const closed = loans.filter((l) => {
    if (l.status !== 'written_off') return false
    if (!l.closed_at) return false
    const iso = l.closed_at.slice(0, 10)
    return iso >= range.from && iso <= range.to
  })

  const headers = ['borrower', 'loan_id', 'principal', 'start_date', 'closed_at', 'loss']
  const rows = closed.map((l) => {
    const summary = summarizeAt(l, l.closed_at ? new Date(l.closed_at) : range.toDate)
    return [
      l.borrower_name,
      l.id,
      l.principal,
      l.start_date,
      l.closed_at ? l.closed_at.slice(0, 10) : '',
      summary ? Number(summary.currentBalance.toFixed(2)) : 0,
    ]
  })

  return csvResponse(`write_offs_${range.from}_to_${range.to}.csv`, toCsv(headers, rows))
}
