'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { borrowerSchema, type BorrowerInput } from '@/lib/validation/borrower'
import { createBorrower, updateBorrower } from './actions'
import { Field } from '@/components/form/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Props {
  mode: 'create' | 'edit'
  borrowerId?: string
  initial?: BorrowerInput
}

const empty: BorrowerInput = {
  fullName: '',
  mobile: null,
  email: null,
  address: null,
  notes: null,
}

export function BorrowerForm({ mode, borrowerId, initial }: Props) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BorrowerInput>({
    resolver: zodResolver(borrowerSchema),
    defaultValues: initial ?? empty,
  })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createBorrower(values)
          : await updateBorrower(borrowerId!, values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, msg] of Object.entries(result.fieldErrors)) {
            setError(key as keyof BorrowerInput, { message: msg })
          }
        }
        setFormError(result.error)
        return
      }
      router.push(mode === 'create' ? `/borrowers/${result.id}` : `/borrowers/${borrowerId}`)
      router.refresh()
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError ? (
        <p role="alert" className="border-destructive/40 text-destructive rounded-md border bg-red-50 px-3 py-2 text-sm">
          {formError}
        </p>
      ) : null}

      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="mobile" label="Mobile" optional error={errors.mobile?.message}>
          <Input id="mobile" inputMode="tel" {...register('mobile')} />
        </Field>
        <Field id="email" label="Email" optional error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </Field>
      </div>

      <Field id="address" label="Address" optional error={errors.address?.message}>
        <Textarea id="address" rows={2} {...register('address')} />
      </Field>

      <Field id="notes" label="Notes" optional error={errors.notes?.message}>
        <Textarea id="notes" rows={3} {...register('notes')} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : mode === 'create' ? 'Create borrower' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
