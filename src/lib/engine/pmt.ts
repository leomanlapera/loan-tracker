import Decimal from 'decimal.js'
import { D, money, ZERO } from './money'
import type { DecimalLike } from './types'

/**
 * Equal-installment payment. Rate is a per-period decimal (e.g. 0.05 for 5%).
 * If rate is 0, PMT = principal / n. Rounded half-up to 2 decimals.
 * Returns ZERO if n <= 0 or principal <= 0.
 */
export function pmt(principal: DecimalLike, rate: DecimalLike, n: number): Decimal {
  const P = D(principal)
  const r = D(rate)
  if (n <= 0 || P.lte(0)) return ZERO
  if (r.eq(0)) return money(P.div(n))
  const onePlusR = r.plus(1)
  const denom = D(1).minus(onePlusR.pow(-n))
  return money(P.mul(r).div(denom))
}
