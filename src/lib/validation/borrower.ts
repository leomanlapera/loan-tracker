import { z } from 'zod'

const optionalTrimmed = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()

export const borrowerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  mobile: optionalTrimmed,
  email: z
    .union([z.literal(''), z.string().trim().email('Enter a valid email')])
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  address: optionalTrimmed,
  notes: optionalTrimmed,
})

export type BorrowerInput = z.infer<typeof borrowerSchema>
