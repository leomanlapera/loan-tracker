import { addMonths, isAfter, isBefore, isEqual, addDays } from 'date-fns'
import type { PaymentInput } from './types'

export function dueDateOf(startDate: Date, period: number): Date {
  return addMonths(startDate, period)
}

export function periodOfPayment(
  startDate: Date,
  paidOn: Date,
  maxPeriods: number,
): number {
  for (let k = 1; k <= maxPeriods; k++) {
    const due = dueDateOf(startDate, k)
    if (!isAfter(paidOn, due)) return k
  }
  return maxPeriods
}

export function paymentsInPeriod(
  payments: PaymentInput[],
  startDate: Date,
  period: number,
): PaymentInput[] {
  const currDue = dueDateOf(startDate, period)
  const prevDue = period === 1 ? null : dueDateOf(startDate, period - 1)
  return payments.filter((p) => {
    const paid = p.paidOn
    const afterPrev = prevDue === null ? true : isAfter(paid, prevDue)
    const onOrBeforeCurr = !isAfter(paid, currDue)
    return afterPrev && onOrBeforeCurr
  })
}

export function isDueDatePassed(dueDate: Date, graceDays: number, asOf: Date): boolean {
  const cutoff = addDays(dueDate, graceDays)
  return isAfter(asOf, cutoff)
}

export function isDueDateFuture(dueDate: Date, asOf: Date): boolean {
  return isAfter(dueDate, asOf)
}

export function isSameOrBefore(a: Date, b: Date): boolean {
  return isBefore(a, b) || isEqual(a, b)
}
