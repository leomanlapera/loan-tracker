import Decimal from 'decimal.js'
import { compute } from './compute'
import type { LoanInput, PaymentInput } from './types'

export interface LoanSummary {
  currentBalance: Decimal
  totalPaid: Decimal
  interestEarned: Decimal
  nextDueDate: Date | null
  nextDueAmount: Decimal
  isPaid: boolean
}

/**
 * Convenience wrapper that ignores validation errors (returns zeros) — useful
 * for list rows that don't want a bad loan row to break the whole page.
 */
export function summarize(
  loan: LoanInput,
  payments: PaymentInput[],
  asOf: Date,
): LoanSummary | null {
  try {
    const out = compute({ loan, payments, asOf })
    return {
      currentBalance: out.currentBalance,
      totalPaid: out.totalPaid,
      interestEarned: out.interestEarnedToDate,
      nextDueDate: out.nextDueDate,
      nextDueAmount: out.nextDueAmount,
      isPaid: out.isPaid,
    }
  } catch {
    return null
  }
}
