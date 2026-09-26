import { z } from 'zod'

export const INTEREST_METHODS = ['compound', 'simple'] as const
export const REPAYMENT_TYPES = ['lump_sum', 'equal_installments', 'custom'] as const
export const AFTER_MATURITY = ['continue_accruing', 'stop_accruing'] as const
export const LOAN_STATUSES = ['active', 'paid', 'written_off', 'cancelled'] as const
export const HIGH_RATE_THRESHOLD = 6

const decimalString = (max: number, dp: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, 'Enter a number')
    .refine((v) => Number(v) <= max, `Must be ≤ ${max}`)
    .refine((v) => {
      const parts = v.split('.')
      return !parts[1] || parts[1].length <= dp
    }, `At most ${dp} decimal places`)

export const customScheduleEntrySchema = z.object({
  period: z.number().int().min(1),
  plannedAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, 'Enter a non-negative amount')
    .refine((v) => Number(v) >= 0, 'Must be ≥ 0'),
})

export const loanSchema = z
  .object({
    borrowerId: z.string().uuid('Choose a borrower'),
    principal: decimalString(1_000_000_000, 2).refine(
      (v) => Number(v) > 0,
      'Principal must be > 0',
    ),
    monthlyRate: decimalString(100, 4),
    tenureMonths: z
      .number({ error: 'Tenure is required' })
      .int()
      .min(1, 'At least 1 month')
      .max(120, 'At most 120 months'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date is required'),
    interestMethod: z.enum(INTEREST_METHODS),
    repaymentType: z.enum(REPAYMENT_TYPES),
    afterMaturity: z.enum(AFTER_MATURITY),
    graceDays: z.number().int().min(0, 'Must be ≥ 0').max(365, 'Must be ≤ 365'),
    agreementInWriting: z
      .boolean()
      .refine((v) => v === true, {
        message: 'Confirm the interest terms are in a signed written agreement',
      }),
    notes: z
      .string()
      .max(2000)
      .transform((v) => v.trim())
      .transform((v) => (v.length === 0 ? null : v))
      .nullable()
      .optional(),
    referenceNo: z
      .string()
      .max(120)
      .transform((v) => v.trim())
      .transform((v) => (v.length === 0 ? null : v))
      .nullable()
      .optional(),
    customSchedule: z.array(customScheduleEntrySchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.repaymentType !== 'custom') return
    if (!data.customSchedule || data.customSchedule.length !== data.tenureMonths) {
      ctx.addIssue({
        code: 'custom',
        path: ['customSchedule'],
        message: 'Custom schedule must have one row per tenure month',
      })
      return
    }
    const periods = new Set<number>()
    for (const row of data.customSchedule) {
      if (row.period < 1 || row.period > data.tenureMonths) {
        ctx.addIssue({
          code: 'custom',
          path: ['customSchedule'],
          message: `Period ${row.period} is out of range`,
        })
      }
      if (periods.has(row.period)) {
        ctx.addIssue({
          code: 'custom',
          path: ['customSchedule'],
          message: `Period ${row.period} is duplicated`,
        })
      }
      periods.add(row.period)
    }
  })

export type LoanInput = z.infer<typeof loanSchema>
