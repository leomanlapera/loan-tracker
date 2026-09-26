import { z } from 'zod'
import { format } from 'date-fns'

export const PAYMENT_METHODS = [
  'cash',
  'gcash',
  'maya',
  'bank_transfer',
  'check',
  'other',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
  bank_transfer: 'Bank transfer',
  check: 'Check',
  other: 'Other',
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional()

export const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a positive amount (up to 2 decimals)')
    .refine((v) => Number(v) > 0, 'Amount must be > 0'),
  paidOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required')
    .refine((v) => v <= format(new Date(), 'yyyy-MM-dd'), 'Date cannot be in the future'),
  method: z.enum(PAYMENT_METHODS),
  referenceNo: optionalText(120),
  note: optionalText(2000),
})

export type PaymentInput = z.infer<typeof paymentSchema>
