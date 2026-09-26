import Decimal from 'decimal.js'

Decimal.set({ rounding: Decimal.ROUND_HALF_UP })

export const money = (v: Decimal.Value): Decimal =>
  new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

export function placeholderPayoff(principal: Decimal.Value): Decimal {
  return money(principal)
}
