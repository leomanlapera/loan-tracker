import Decimal from 'decimal.js'
import { D, money, ZERO } from './money'
import { dueDateOf, paymentsInPeriod } from './period'
import type { LoanInput, PaymentInput } from './types'

export interface PaymentAllocation {
  paymentIndex: number
  paidOn: Date
  amount: Decimal
  toInterest: Decimal
  toPrincipal: Decimal
  periodIndex: number
}

/**
 * Walk periods and attribute each payment's interest/principal split.
 * Within a period, payments are consumed in paid_on order — earlier payments
 * fill up the accrued-interest bucket first.
 *
 * Post-maturity payments (paid_on > maturity due date) still get attributed;
 * the loop keeps accruing per the loan's afterMaturity setting until every
 * payment has been assigned to a period.
 */
export function allocatePayments(
  loan: LoanInput,
  payments: PaymentInput[],
): PaymentAllocation[] {
  const rate = D(loan.monthlyRate).div(100)
  const indexed = payments.map((p, idx) => ({ ...p, idx }))
  const allocations: PaymentAllocation[] = []

  let principal = money(loan.principal)
  let unpaidInterest = ZERO

  const maxPeriod = Math.max(loan.tenureMonths, findLastPaymentPeriod(loan, indexed))

  for (let k = 1; k <= maxPeriod; k++) {
    const interest = money(principal.mul(rate))

    const periodPayments = paymentsInPeriod(indexed, loan.startDate, k)
      .slice()
      .sort((a, b) => a.paidOn.getTime() - b.paidOn.getTime())

    let interestPool = unpaidInterest.plus(interest)
    let principalPaidTotal = ZERO

    for (const p of periodPayments) {
      const amount = D(p.amount)
      const toInterest = Decimal.min(amount, interestPool)
      const toPrincipal = amount.minus(toInterest)
      interestPool = interestPool.minus(toInterest)
      principalPaidTotal = principalPaidTotal.plus(toPrincipal)
      allocations.push({
        paymentIndex: (p as PaymentInput & { idx: number }).idx,
        paidOn: p.paidOn,
        amount,
        toInterest,
        toPrincipal,
        periodIndex: k,
      })
    }

    let newUnpaid = interestPool
    let newPrincipal = principal.minus(principalPaidTotal)
    if (newPrincipal.lt(0)) newPrincipal = ZERO

    if (loan.interestMethod === 'compound') {
      newPrincipal = newPrincipal.plus(newUnpaid)
      newUnpaid = ZERO
    }

    principal = money(newPrincipal)
    unpaidInterest = money(newUnpaid)

    if (k >= loan.tenureMonths) {
      if (loan.afterMaturity === 'stop_accruing') break
      if (principal.plus(unpaidInterest).lte(0)) break
    }
  }

  return allocations.sort((a, b) => a.paymentIndex - b.paymentIndex)
}

function findLastPaymentPeriod(loan: LoanInput, payments: PaymentInput[]): number {
  let last = 0
  for (const p of payments) {
    for (let k = 1; k <= 480; k++) {
      const due = dueDateOf(loan.startDate, k)
      if (p.paidOn.getTime() <= due.getTime()) {
        if (k > last) last = k
        break
      }
    }
  }
  return last
}
