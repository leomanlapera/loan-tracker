import { D } from './money'
import type { EngineInput, LoanInput, PaymentInput } from './types'

export class EngineInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineInputError'
  }
}

function assertLoan(loan: LoanInput): void {
  if (D(loan.principal).lte(0)) {
    throw new EngineInputError('principal must be > 0')
  }
  if (D(loan.monthlyRate).lt(0)) {
    throw new EngineInputError('monthlyRate must be >= 0')
  }
  if (D(loan.monthlyRate).gt(100)) {
    throw new EngineInputError('monthlyRate must be <= 100')
  }
  if (!Number.isInteger(loan.tenureMonths) || loan.tenureMonths < 1 || loan.tenureMonths > 120) {
    throw new EngineInputError('tenureMonths must be an integer between 1 and 120')
  }
  if (!Number.isInteger(loan.graceDays) || loan.graceDays < 0) {
    throw new EngineInputError('graceDays must be a non-negative integer')
  }
  if (!(loan.startDate instanceof Date) || Number.isNaN(loan.startDate.getTime())) {
    throw new EngineInputError('startDate must be a valid Date')
  }
  if (loan.repaymentType === 'custom') {
    if (!loan.customSchedule || loan.customSchedule.length !== loan.tenureMonths) {
      throw new EngineInputError(
        'custom repayment requires a customSchedule with one entry per period',
      )
    }
    const seen = new Set<number>()
    for (const entry of loan.customSchedule) {
      if (!Number.isInteger(entry.period) || entry.period < 1 || entry.period > loan.tenureMonths) {
        throw new EngineInputError(`custom schedule period ${entry.period} out of range`)
      }
      if (seen.has(entry.period)) {
        throw new EngineInputError(`custom schedule has duplicate period ${entry.period}`)
      }
      seen.add(entry.period)
      if (D(entry.plannedAmount).lt(0)) {
        throw new EngineInputError('custom schedule plannedAmount must be >= 0')
      }
    }
  }
}

function assertPayments(payments: PaymentInput[], asOf: Date): void {
  for (const p of payments) {
    if (!(p.paidOn instanceof Date) || Number.isNaN(p.paidOn.getTime())) {
      throw new EngineInputError('payment paidOn must be a valid Date')
    }
    if (D(p.amount).lte(0)) {
      throw new EngineInputError('payment amount must be > 0')
    }
    if (p.paidOn.getTime() > asOf.getTime()) {
      throw new EngineInputError('payment paidOn cannot be in the future (relative to asOf)')
    }
  }
}

export function assertEngineInput(input: EngineInput): void {
  if (!(input.asOf instanceof Date) || Number.isNaN(input.asOf.getTime())) {
    throw new EngineInputError('asOf must be a valid Date')
  }
  assertLoan(input.loan)
  assertPayments(input.payments, input.asOf)
}
