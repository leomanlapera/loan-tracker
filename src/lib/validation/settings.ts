import { z } from 'zod'
import { INTEREST_METHODS, REPAYMENT_TYPES } from './loan'

export const settingsSchema = z.object({
  displayName: z
    .string()
    .max(120)
    .transform((v) => v.trim())
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
  defaultGraceDays: z
    .number({ error: 'Grace days is required' })
    .int()
    .min(0, 'Must be ≥ 0')
    .max(365, 'Must be ≤ 365'),
  defaultInterestMethod: z.enum(INTEREST_METHODS),
  defaultRepaymentType: z.enum(REPAYMENT_TYPES),
})

export type SettingsInput = z.infer<typeof settingsSchema>
