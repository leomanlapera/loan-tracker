import { describe, it, expect } from 'vitest'
import { money, placeholderPayoff } from './index'

describe('engine placeholder', () => {
  it('rounds half-up to 2 decimals', () => {
    expect(money('1.005').toFixed(2)).toBe('1.01')
    expect(money('1.004').toFixed(2)).toBe('1.00')
  })

  it('placeholder payoff returns the principal, rounded', () => {
    expect(placeholderPayoff('10000').toFixed(2)).toBe('10000.00')
  })
})
