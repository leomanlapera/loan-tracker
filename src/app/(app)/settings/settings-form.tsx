'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingsSchema, type SettingsInput } from '@/lib/validation/settings'
import { updateSettings } from './actions'
import { Field } from '@/components/form/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { INTEREST_METHODS, REPAYMENT_TYPES } from '@/lib/validation/loan'

interface Props {
  initial: SettingsInput
}

export function SettingsForm({ initial }: Props) {
  const router = useRouter()
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
    mode: 'onBlur',
  })

  const onSubmit = handleSubmit((values) => {
    setState(null)
    startTransition(async () => {
      const result = await updateSettings(values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [k, msg] of Object.entries(result.fieldErrors)) {
            setError(k as keyof SettingsInput, { message: msg })
          }
        }
        setState({ ok: false, message: result.error })
        return
      }
      setState({ ok: true, message: result.message ?? 'Saved.' })
      router.refresh()
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {state ? (
        <p
          role="status"
          className={
            state.ok
              ? 'rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
              : 'border-destructive/40 text-destructive rounded-md border bg-red-50 px-3 py-2 text-sm'
          }
        >
          {state.message}
        </p>
      ) : null}

      <Field id="displayName" label="Display name" optional error={errors.displayName?.message}>
        <Input id="displayName" {...register('displayName')} />
      </Field>

      <Field id="defaultGraceDays" label="Default grace period (days)" error={errors.defaultGraceDays?.message}>
        <Input
          id="defaultGraceDays"
          type="number"
          min={0}
          max={365}
          {...register('defaultGraceDays', { valueAsNumber: true })}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="defaultInterestMethod"
          label="Default interest method"
          error={errors.defaultInterestMethod?.message}
        >
          <Select
            value={watch('defaultInterestMethod')}
            onValueChange={(v) =>
              setValue('defaultInterestMethod', (v ?? 'compound') as (typeof INTEREST_METHODS)[number])
            }
          >
            <SelectTrigger id="defaultInterestMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTEREST_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m === 'compound' ? 'Compound' : 'Simple'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          id="defaultRepaymentType"
          label="Default repayment type"
          error={errors.defaultRepaymentType?.message}
        >
          <Select
            value={watch('defaultRepaymentType')}
            onValueChange={(v) =>
              setValue('defaultRepaymentType', (v ?? 'equal_installments') as (typeof REPAYMENT_TYPES)[number])
            }
          >
            <SelectTrigger id="defaultRepaymentType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal_installments">Equal installments</SelectItem>
              <SelectItem value="lump_sum">Lump sum at maturity</SelectItem>
              <SelectItem value="custom">Custom schedule</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}
