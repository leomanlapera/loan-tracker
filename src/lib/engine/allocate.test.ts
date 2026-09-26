import { describe, it, expect } from 'vitest'
import { allocatePayments } from './allocate'
import type { LoanInput } from './types'

const d = (iso: string) => new Date(`${iso}T00:00:00Z`)

const baseLoan = (over: Partial<LoanInput> = {}): LoanInput => ({
  principal: 10000,
  monthlyRate: 5,
  tenureMonths: 3,
  startDate: d('2026-01-01'),
  interestMethod: 'compound',
  repaymentType: 'equal_installments',
  afterMaturity: 'continue_accruing',
  graceDays: 0,
  ...over,
})

describe('allocatePayments', () => {
  it('splits each PRD Case 2 payment into interest and principal', () => {
    const out = allocatePayments(baseLoan(), [
      { amount: 3672.09, paidOn: d('2026-02-01') },
      { amount: 3672.09, paidOn: d('2026-03-01') },
      { amount: 3672.08, paidOn: d('2026-04-01') },
    ])
    expect(out).toHaveLength(3)
    expect(out[0].toInterest.toFixed(2)).toBe('500.00')
    expect(out[0].toPrincipal.toFixed(2)).toBe('3172.09')
    expect(out[1].toInterest.toFixed(2)).toBe('341.40')
    expect(out[1].toPrincipal.toFixed(2)).toBe('3330.69')
    expect(out[2].toInterest.toFixed(2)).toBe('174.86')
    expect(out[2].toPrincipal.toFixed(2)).toBe('3497.22')
  })

  it('sums to the same interestEarnedToDate as engine.compute', async () => {
    const { compute } = await import('./compute')
    const payments = [
      { amount: 3672.09, paidOn: d('2026-02-01') },
      { amount: 3672.09, paidOn: d('2026-03-01') },
      { amount: 3672.08, paidOn: d('2026-04-01') },
    ]
    const alloc = allocatePayments(baseLoan(), payments)
    const totalInterest = alloc.reduce((s, r) => s + Number(r.toInterest.toFixed(2)), 0)
    const out = compute({ loan: baseLoan(), payments, asOf: d('2026-05-01') })
    expect(totalInterest.toFixed(2)).toBe(out.interestEarnedToDate.toFixed(2))
  })

  it('within a period, earlier payments consume interest first', () => {
    const out = allocatePayments(baseLoan({ repaymentType: 'lump_sum' }), [
      { amount: 200, paidOn: d('2026-01-15') },
      { amount: 500, paidOn: d('2026-01-25') },
    ])
    expect(out[0].toInterest.toFixed(2)).toBe('200.00')
    expect(out[0].toPrincipal.toFixed(2)).toBe('0.00')
    expect(out[1].toInterest.toFixed(2)).toBe('300.00')
    expect(out[1].toPrincipal.toFixed(2)).toBe('200.00')
  })
})
