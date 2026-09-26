import { describe, it, expect } from 'vitest'
import { compute, validatePayment, pmt, dueDateOf, EngineInputError } from './index'
import type { EngineInput, LoanInput, PaymentInput } from './types'

const d = (iso: string) => new Date(`${iso}T00:00:00Z`)

const baseLoan = (over: Partial<LoanInput> = {}): LoanInput => ({
  principal: 10000,
  monthlyRate: 5,
  tenureMonths: 3,
  startDate: d('2026-01-01'),
  interestMethod: 'compound',
  repaymentType: 'lump_sum',
  afterMaturity: 'continue_accruing',
  graceDays: 0,
  ...over,
})

const run = (loan: LoanInput, payments: PaymentInput[] = [], asOfISO = '2026-05-01') =>
  compute({ loan, payments, asOf: d(asOfISO) } as EngineInput)

describe('PRD §6.6 — Case 1: Lump sum, ₱10,000, 5%/month, 3 months', () => {
  it('compound final balance = ₱11,576.25 at maturity', () => {
    const out = run(baseLoan({ interestMethod: 'compound', repaymentType: 'lump_sum' }), [], '2026-04-01')
    const maturity = out.schedule.find((r) => r.period === 3)!
    expect(maturity.closingBalance.toFixed(2)).toBe('11576.25')
  })

  it('simple final balance = ₱11,500.00 at maturity', () => {
    const out = run(baseLoan({ interestMethod: 'simple', repaymentType: 'lump_sum' }), [], '2026-04-01')
    const maturity = out.schedule.find((r) => r.period === 3)!
    expect(maturity.closingBalance.toFixed(2)).toBe('11500.00')
  })
})

describe('PRD §6.6 — Case 2: Equal installments, compound, ₱10,000, 5%/month, 3 months', () => {
  const out = run(baseLoan({ repaymentType: 'equal_installments' }), [
    { amount: 3672.09, paidOn: d('2026-02-01') },
    { amount: 3672.09, paidOn: d('2026-03-01') },
    { amount: 3672.08, paidOn: d('2026-04-01') },
  ])

  it('period 1 opening=10000 interest=500 payment=3672.09 closing=6827.91', () => {
    const p = out.schedule[0]
    expect(p.openingBalance.toFixed(2)).toBe('10000.00')
    expect(p.interestAccrued.toFixed(2)).toBe('500.00')
    expect(p.scheduledPayment.toFixed(2)).toBe('3672.09')
    expect(p.actualPayment.toFixed(2)).toBe('3672.09')
    expect(p.closingBalance.toFixed(2)).toBe('6827.91')
  })

  it('period 2 opening=6827.91 interest=341.40 payment=3672.09 closing=3497.22', () => {
    const p = out.schedule[1]
    expect(p.openingBalance.toFixed(2)).toBe('6827.91')
    expect(p.interestAccrued.toFixed(2)).toBe('341.40')
    expect(p.scheduledPayment.toFixed(2)).toBe('3672.09')
    expect(p.actualPayment.toFixed(2)).toBe('3672.09')
    expect(p.closingBalance.toFixed(2)).toBe('3497.22')
  })

  it('period 3 opening=3497.22 interest=174.86 payment=3672.08 closing=0.00', () => {
    const p = out.schedule[2]
    expect(p.openingBalance.toFixed(2)).toBe('3497.22')
    expect(p.interestAccrued.toFixed(2)).toBe('174.86')
    expect(p.scheduledPayment.toFixed(2)).toBe('3672.08')
    expect(p.actualPayment.toFixed(2)).toBe('3672.08')
    expect(p.closingBalance.toFixed(2)).toBe('0.00')
  })

  it('total paid = ₱11,016.26 and loan is paid', () => {
    expect(out.totalPaid.toFixed(2)).toBe('11016.26')
    expect(out.isPaid).toBe(true)
    expect(out.currentBalance.toFixed(2)).toBe('0.00')
  })
})

describe('PRD §6.6 — Case 3: Missed period-1 payment, compound lump sum', () => {
  it('period 2 opening balance = ₱10,500.00', () => {
    const out = run(baseLoan())
    expect(out.schedule[1].openingBalance.toFixed(2)).toBe('10500.00')
  })
})

describe('PMT formula', () => {
  it('r=0 returns principal / n', () => {
    expect(pmt(1200, 0, 12).toFixed(2)).toBe('100.00')
  })

  it('compound 5% × 3 on 10000 ≈ 3672.09', () => {
    expect(pmt(10000, 0.05, 3).toFixed(2)).toBe('3672.09')
  })

  it('n<=0 returns 0', () => {
    expect(pmt(10000, 0.05, 0).toFixed(2)).toBe('0.00')
  })
})

describe('period math', () => {
  it('addMonths clamps end-of-month (Jan 31 → Feb 28)', () => {
    expect(dueDateOf(d('2026-01-31'), 1).toISOString().slice(0, 10)).toBe('2026-02-28')
  })

  it('period 2 returns to original day if month has it (Jan 31 → Mar 31)', () => {
    expect(dueDateOf(d('2026-01-31'), 2).toISOString().slice(0, 10)).toBe('2026-03-31')
  })
})

describe('zero-rate equal installments', () => {
  it('splits principal evenly and closes at 0', () => {
    const out = run(
      baseLoan({
        monthlyRate: 0,
        tenureMonths: 4,
        principal: 1000,
        repaymentType: 'equal_installments',
      }),
      [
        { amount: 250, paidOn: d('2026-02-01') },
        { amount: 250, paidOn: d('2026-03-01') },
        { amount: 250, paidOn: d('2026-04-01') },
        { amount: 250, paidOn: d('2026-05-01') },
      ],
    )
    expect(out.schedule[0].scheduledPayment.toFixed(2)).toBe('250.00')
    expect(out.schedule[3].closingBalance.toFixed(2)).toBe('0.00')
    expect(out.isPaid).toBe(true)
  })
})

describe('partial payment (compound equal installments) — re-amortize', () => {
  it('shortfall in period 1 raises PMT for remaining periods', () => {
    const out = run(baseLoan({ repaymentType: 'equal_installments' }), [
      { amount: 2000, paidOn: d('2026-02-01') },
    ])
    expect(out.schedule[0].actualPayment.toFixed(2)).toBe('2000.00')
    expect(out.schedule[0].closingBalance.toFixed(2)).toBe('8500.00')
    const period2Sched = out.schedule[1].scheduledPayment
    expect(Number(period2Sched.toFixed(2))).toBeGreaterThan(3672.09)
    const period3Sched = out.schedule[2].scheduledPayment
    expect(period3Sched.toFixed(2)).toBe(out.schedule[2].openingBalance.plus(out.schedule[2].interestAccrued).toFixed(2))
  })
})

describe('overpayment rejection', () => {
  it('rejects a payment larger than payoff amount', () => {
    const loan = baseLoan()
    const asOf = '2026-02-15'
    const input: EngineInput = { loan, payments: [], asOf: d(asOf) }
    const preview = compute(input)
    const payoff = preview.payoffAmount
    const attempt = payoff.plus(1)
    const v = validatePayment(input, attempt)
    expect(v.ok).toBe(false)
    expect(v.payoffAmount.toFixed(2)).toBe(payoff.toFixed(2))
  })

  it('accepts a payment exactly at payoff amount', () => {
    const loan = baseLoan()
    const asOf = '2026-02-15'
    const input: EngineInput = { loan, payments: [], asOf: d(asOf) }
    const preview = compute(input)
    const v = validatePayment(input, preview.payoffAmount)
    expect(v.ok).toBe(true)
  })
})

describe('after-maturity behavior', () => {
  it('continue_accruing keeps accruing past tenure', () => {
    const out = run(baseLoan({ afterMaturity: 'continue_accruing' }), [], '2026-06-01')
    expect(out.schedule.length).toBeGreaterThan(3)
    const period4 = out.schedule[3]
    expect(period4.period).toBe(4)
    expect(Number(period4.interestAccrued.toFixed(2))).toBeGreaterThan(0)
  })

  it('stop_accruing freezes at maturity balance', () => {
    const out = run(baseLoan({ afterMaturity: 'stop_accruing' }), [], '2026-06-01')
    expect(out.schedule.length).toBe(3)
    expect(out.currentBalance.toFixed(2)).toBe('11576.25')
  })
})

describe('overdue flag', () => {
  it('flags period as overdue when past due + grace and underpaid', () => {
    const out = run(
      baseLoan({ repaymentType: 'equal_installments', graceDays: 3 }),
      [],
      '2026-02-10',
    )
    expect(out.schedule[0].isOverdue).toBe(true)
  })

  it('does not flag overdue within grace period', () => {
    const out = run(
      baseLoan({ repaymentType: 'equal_installments', graceDays: 5 }),
      [],
      '2026-02-03',
    )
    expect(out.schedule[0].isOverdue).toBe(false)
  })
})

describe('input validation', () => {
  const asOf = d('2026-05-01')

  it('rejects principal <= 0', () => {
    expect(() =>
      compute({ loan: baseLoan({ principal: 0 }), payments: [], asOf }),
    ).toThrow(EngineInputError)
  })

  it('rejects negative rate', () => {
    expect(() =>
      compute({ loan: baseLoan({ monthlyRate: -1 }), payments: [], asOf }),
    ).toThrow(EngineInputError)
  })

  it('rejects tenure out of range', () => {
    expect(() =>
      compute({ loan: baseLoan({ tenureMonths: 0 }), payments: [], asOf }),
    ).toThrow(EngineInputError)
    expect(() =>
      compute({ loan: baseLoan({ tenureMonths: 121 }), payments: [], asOf }),
    ).toThrow(EngineInputError)
  })

  it('rejects negative payments', () => {
    expect(() =>
      compute({
        loan: baseLoan(),
        payments: [{ amount: -100, paidOn: d('2026-02-01') }],
        asOf,
      }),
    ).toThrow(EngineInputError)
  })

  it('rejects payment dated after asOf', () => {
    expect(() =>
      compute({
        loan: baseLoan(),
        payments: [{ amount: 100, paidOn: d('2026-06-01') }],
        asOf: d('2026-05-01'),
      }),
    ).toThrow(EngineInputError)
  })

  it('rejects custom schedule of wrong length', () => {
    expect(() =>
      compute({
        loan: baseLoan({
          repaymentType: 'custom',
          customSchedule: [{ period: 1, plannedAmount: 1000 }],
        }),
        payments: [],
        asOf,
      }),
    ).toThrow(EngineInputError)
  })
})

describe('custom repayment type', () => {
  it('last period is auto-adjusted to close balance', () => {
    const out = run(
      baseLoan({
        repaymentType: 'custom',
        customSchedule: [
          { period: 1, plannedAmount: 1000 },
          { period: 2, plannedAmount: 1000 },
          { period: 3, plannedAmount: 0 },
        ],
      }),
      [
        { amount: 1000, paidOn: d('2026-02-01') },
        { amount: 1000, paidOn: d('2026-03-01') },
      ],
    )
    expect(out.schedule[0].scheduledPayment.toFixed(2)).toBe('1000.00')
    expect(out.schedule[2].scheduledPayment.toFixed(2)).toBe(
      out.schedule[2].openingBalance.plus(out.schedule[2].interestAccrued).toFixed(2),
    )
  })
})

describe('current balance / payoff mid-period', () => {
  it('payoff amount includes full-month interest for current period', () => {
    const out = run(baseLoan({ repaymentType: 'equal_installments' }), [], '2026-01-15')
    expect(out.payoffAmount.toFixed(2)).toBe('10500.00')
  })

  it('payoff = 0 when loan is fully paid', () => {
    const out = run(baseLoan({ repaymentType: 'equal_installments' }), [
      { amount: 3672.09, paidOn: d('2026-02-01') },
      { amount: 3672.09, paidOn: d('2026-03-01') },
      { amount: 3672.08, paidOn: d('2026-04-01') },
    ])
    expect(out.payoffAmount.toFixed(2)).toBe('0.00')
  })
})

describe('simple interest — unpaid stays separate', () => {
  it('missed period 1 does not compound in period 2 (simple)', () => {
    const out = run(baseLoan({ interestMethod: 'simple' }), [], '2026-04-01')
    expect(out.schedule[0].closingBalance.toFixed(2)).toBe('10500.00')
    expect(out.schedule[1].interestAccrued.toFixed(2)).toBe('500.00')
    expect(out.schedule[1].closingBalance.toFixed(2)).toBe('11000.00')
  })
})
