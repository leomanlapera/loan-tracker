import type { NextRequest } from 'next/server'
import { csvResponse, toCsv } from '@/lib/csv'
import { loadAllLoans, summarizeAt } from '@/lib/reports/loans'
import { parseDateRange } from '@/lib/reports/date-range'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const range = parseDateRange(params)
  const loans = await loadAllLoans()
  const asOf = range.toDate

  const headers = [
    'borrower',
    'principal',
    'monthly_rate',
    'tenure_months',
    'start_date',
    'interest_method',
    'repayment_type',
    'status',
    'current_balance',
    'total_paid',
    'interest_earned',
    'reference_no',
  ]
  const rows = loans
    .filter((l) => l.start_date <= range.to)
    .map((l) => {
      const s = summarizeAt(l, asOf)
      return [
        l.borrower_name,
        l.principal,
        l.monthly_rate,
        l.tenure_months,
        l.start_date,
        l.interest_method,
        l.repayment_type,
        l.status,
        s ? Number(s.currentBalance.toFixed(2)) : 0,
        s ? Number(s.totalPaid.toFixed(2)) : 0,
        s ? Number(s.interestEarnedToDate.toFixed(2)) : 0,
        l.reference_no,
      ]
    })

  return csvResponse(`portfolio_${range.from}_to_${range.to}.csv`, toCsv(headers, rows))
}
