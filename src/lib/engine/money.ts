import Decimal from 'decimal.js'
import type { DecimalLike } from './types'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export const D = (v: DecimalLike): Decimal => new Decimal(v)

export const money = (v: DecimalLike): Decimal =>
  new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

export const ZERO = new Decimal(0)
