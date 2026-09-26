import type { NextRequest } from 'next/server'
import { csvResponse, toCsv } from '@/lib/csv'
import { loadAllLoans, summarizeAt } from '@/lib/reports/loans'
import { parseDateRange } from '@/lib/reports/date-range'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const borrowerId = typeof params.borrowerId === 'string' ? params.borrowerId : undefined
  if (!borrowerId) return new Response('borrowerId required', { status: 400 })
  const range = parseDateRange(params)

  const loans = (await loadAllLoans()).filter((l) => l.borrower_id === borrowerId)

  const headers = [
    'loan_id',
    'section',
    'period',
    'date',
    'description',
    'interest',
    'scheduled',
    'actual',
    'closing_balance',
    'method',
    'reference_no',
    'note',
  ]
  const rows: (string | number | null)[][] = []
  for (const loan of loans) {
    const summary = summarizeAt(loan, range.toDate)
    for (const r of summary?.schedule ?? []) {
      rows.push([
        loan.id,
        'schedule',
        r.period,
        r.dueDate.toISOString().slice(0, 10),
        `period ${r.period}`,
        Number(r.interestAccrued.toFixed(2)),
        Number(r.scheduledPayment.toFixed(2)),
        Number(r.actualPayment.toFixed(2)),
        Number(r.closingBalance.toFixed(2)),
        null,
        null,
        r.status,
      ])
    }
    const paymentsInRange = loan.payments
      .filter((p) => !p.deleted_at && p.paid_on >= range.from && p.paid_on <= range.to)
      .sort((a, b) => (a.paid_on < b.paid_on ? -1 : 1))
    for (const p of paymentsInRange) {
      rows.push([
        loan.id,
        'payment',
        null,
        p.paid_on,
        'payment',
        null,
        null,
        p.amount,
        null,
        p.method,
        p.reference_no,
        p.note,
      ])
    }
  }

  return csvResponse(
    `statement_${borrowerId}_${range.from}_to_${range.to}.csv`,
    toCsv(headers, rows),
  )
}
