import type { NextRequest } from 'next/server'
import { format } from 'date-fns'
import { csvResponse, toCsv } from '@/lib/csv'
import { loadAllLoans } from '@/lib/reports/loans'
import { agingRows } from '@/lib/reports/aging'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const asOfIso = typeof params.asOf === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.asOf)
    ? params.asOf
    : format(new Date(), 'yyyy-MM-dd')
  const asOf = new Date(`${asOfIso}T23:59:59Z`)
  const rows = agingRows(await loadAllLoans(), asOf)

  const headers = ['borrower', 'loan_id', 'bucket', 'days_past_due', 'overdue_amount']
  const body = rows.map((r) => [
    r.borrower,
    r.loanId,
    r.bucket,
    r.daysPastDue,
    Number(r.amount.toFixed(2)),
  ])
  return csvResponse(`aging_${asOfIso}.csv`, toCsv(headers, body))
}
