import Decimal from 'decimal.js'
import { isAfter } from 'date-fns'
import { D, money, ZERO } from './money'
import {
  dueDateOf,
  paymentsInPeriod,
  isDueDatePassed,
  isDueDateFuture,
} from './period'
import { pmt } from './pmt'
import { assertEngineInput } from './validate'
import type {
  EngineInput,
  EngineOutput,
  LoanInput,
  PeriodRow,
  PeriodStatus,
} from './types'

const POST_MATURITY_HARD_CAP = 240

function scheduledFor(
  loan: LoanInput,
  periodIndex: number,
  openingBalance: Decimal,
  interest: Decimal,
  currentInstallment: Decimal,
): Decimal {
  if (periodIndex > loan.tenureMonths) return ZERO

  if (loan.repaymentType === 'lump_sum') {
    if (periodIndex === loan.tenureMonths) return money(openingBalance.plus(interest))
    return ZERO
  }

  if (loan.repaymentType === 'equal_installments') {
    if (periodIndex === loan.tenureMonths) return money(openingBalance.plus(interest))
    return currentInstallment
  }

  // custom
  const entry = loan.customSchedule!.find((e) => e.period === periodIndex)
  const planned = entry ? D(entry.plannedAmount) : ZERO
  if (periodIndex === loan.tenureMonths) return money(openingBalance.plus(interest))
  return money(planned)
}

function statusFor(
  scheduled: Decimal,
  actual: Decimal,
  dueDate: Date,
  asOf: Date,
): PeriodStatus {
  if (isDueDateFuture(dueDate, asOf)) return 'upcoming'
  if (scheduled.lte(0)) return 'paid'
  if (actual.gte(scheduled)) return 'paid'
  if (actual.gt(0)) return 'partial'
  return 'unpaid'
}

function asOfIsInPeriod(startDate: Date, period: number, asOf: Date): boolean {
  const currDue = dueDateOf(startDate, period)
  const prevDue = period === 1 ? null : dueDateOf(startDate, period - 1)
  const afterPrev = prevDue === null ? true : isAfter(asOf, prevDue)
  const onOrBeforeCurr = !isAfter(asOf, currDue)
  return afterPrev && onOrBeforeCurr
}

export function compute(input: EngineInput): EngineOutput {
  assertEngineInput(input)
  const { loan, payments, asOf } = input
  const rate = D(loan.monthlyRate).div(100)
  const maturityDate = dueDateOf(loan.startDate, loan.tenureMonths)

  let principal = money(loan.principal)
  let unpaidInterest = ZERO
  let totalPaid = ZERO
  let interestPaid = ZERO
  let currentInstallment =
    loan.repaymentType === 'equal_installments'
      ? pmt(loan.principal, rate, loan.tenureMonths)
      : ZERO

  const schedule: PeriodRow[] = []
  let payoffAtAsOf: Decimal | null = null
  let balanceAtAsOf: Decimal | null = null

  const maxPeriod =
    loan.afterMaturity === 'continue_accruing'
      ? loan.tenureMonths + POST_MATURITY_HARD_CAP
      : loan.tenureMonths

  for (let k = 1; k <= maxPeriod; k++) {
    const dueDate = dueDateOf(loan.startDate, k)

    if (k > loan.tenureMonths) {
      if (loan.afterMaturity === 'stop_accruing') break
      const balanceNow = principal.plus(unpaidInterest)
      if (balanceNow.lte(0)) break
      if (isDueDateFuture(dueDate, asOf)) break
    }

    const openingBalance = money(principal.plus(unpaidInterest))
    const interest = money(principal.mul(rate))
    const scheduled = scheduledFor(loan, k, openingBalance, interest, currentInstallment)

    const periodPayments = paymentsInPeriod(payments, loan.startDate, k)
    const actualPayment = money(
      periodPayments.reduce<Decimal>((sum, p) => sum.plus(D(p.amount)), ZERO),
    )

    const totalInterestDue = unpaidInterest.plus(interest)
    const toInterest = Decimal.min(actualPayment, totalInterestDue)
    const toPrincipal = actualPayment.minus(toInterest)

    let newUnpaid = totalInterestDue.minus(toInterest)
    let newPrincipal = principal.minus(toPrincipal)
    if (newPrincipal.lt(0)) newPrincipal = ZERO

    if (loan.interestMethod === 'compound') {
      newPrincipal = newPrincipal.plus(newUnpaid)
      newUnpaid = ZERO
    }

    newPrincipal = money(newPrincipal)
    newUnpaid = money(newUnpaid)
    const closingBalance = money(newPrincipal.plus(newUnpaid))

    const isOverdue =
      isDueDatePassed(dueDate, loan.graceDays, asOf) && actualPayment.lt(scheduled)
    const status = statusFor(scheduled, actualPayment, dueDate, asOf)

    schedule.push({
      period: k,
      dueDate,
      openingBalance,
      interestAccrued: interest,
      scheduledPayment: scheduled,
      actualPayment,
      closingBalance,
      status,
      isOverdue,
    })

    if (payoffAtAsOf === null && asOfIsInPeriod(loan.startDate, k, asOf)) {
      payoffAtAsOf = closingBalance
      balanceAtAsOf = closingBalance
    }

    principal = newPrincipal
    unpaidInterest = newUnpaid
    totalPaid = totalPaid.plus(actualPayment)
    interestPaid = interestPaid.plus(toInterest)

    if (
      loan.repaymentType === 'equal_installments' &&
      k < loan.tenureMonths - 1 &&
      !actualPayment.eq(scheduled)
    ) {
      const remaining = loan.tenureMonths - k
      const newOpening = principal.plus(unpaidInterest)
      currentInstallment = pmt(newOpening, rate, remaining)
    }

    if (k >= loan.tenureMonths && principal.plus(unpaidInterest).lte(0)) break
  }

  const finalBalance = money(principal.plus(unpaidInterest))
  if (payoffAtAsOf === null) payoffAtAsOf = finalBalance
  if (balanceAtAsOf === null) balanceAtAsOf = finalBalance

  const isPaid = balanceAtAsOf.lte(0)
  const currentBalance = balanceAtAsOf

  const nextRow = schedule.find(
    (r) =>
      r.scheduledPayment.gt(0) &&
      (r.status === 'upcoming' || r.status === 'unpaid' || r.status === 'partial'),
  )

  return {
    schedule,
    currentBalance,
    totalPaid: money(totalPaid),
    interestEarnedToDate: money(interestPaid),
    nextDueDate: nextRow ? nextRow.dueDate : null,
    nextDueAmount: nextRow
      ? money(nextRow.scheduledPayment.minus(nextRow.actualPayment))
      : ZERO,
    payoffAmount: isPaid ? ZERO : payoffAtAsOf,
    isPaid,
    maturityDate,
  }
}

export function validatePayment(input: EngineInput, newAmount: Decimal.Value) {
  const output = compute(input)
  const amount = D(newAmount)
  const ok = amount.lte(output.payoffAmount)
  return { ok, payoffAmount: output.payoffAmount }
}
