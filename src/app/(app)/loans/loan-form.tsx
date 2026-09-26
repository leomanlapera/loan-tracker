'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import {
  loanSchema,
  type LoanInput,
  INTEREST_METHODS,
  REPAYMENT_TYPES,
  AFTER_MATURITY,
  HIGH_RATE_THRESHOLD,
} from '@/lib/validation/loan'
import { createLoan, updateLoan } from './actions'
import { Field } from '@/components/form/field'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoanPreview } from './loan-preview'

export interface BorrowerOption {
  id: string
  name: string
}

interface Props {
  mode: 'create' | 'edit'
  loanId?: string
  borrowers: BorrowerOption[]
  initial?: Partial<LoanInput>
  editingLocked?: {
    principal?: boolean
    monthlyRate?: boolean
    startDate?: boolean
    interestMethod?: boolean
  }
}

const defaults = (initial?: Partial<LoanInput>): LoanInput => ({
  borrowerId: initial?.borrowerId ?? '',
  principal: initial?.principal ?? '',
  monthlyRate: initial?.monthlyRate ?? '',
  tenureMonths: initial?.tenureMonths ?? 3,
  startDate: initial?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
  interestMethod: initial?.interestMethod ?? 'compound',
  repaymentType: initial?.repaymentType ?? 'equal_installments',
  afterMaturity: initial?.afterMaturity ?? 'continue_accruing',
  graceDays: initial?.graceDays ?? 0,
  agreementInWriting: initial?.agreementInWriting ?? false,
  notes: initial?.notes ?? null,
  referenceNo: initial?.referenceNo ?? null,
  customSchedule: initial?.customSchedule,
})

export function LoanForm({ mode, loanId, borrowers, initial, editingLocked }: Props) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const form = useForm<LoanInput>({
    resolver: zodResolver(loanSchema),
    defaultValues: defaults(initial),
    mode: 'onBlur',
  })
  const { register, handleSubmit, setError, watch, setValue, control, formState } = form
  const { errors } = formState

  const values = watch()

  // Custom schedule field array
  const { fields, replace } = useFieldArray({ control, name: 'customSchedule' })
  useEffect(() => {
    if (values.repaymentType !== 'custom') return
    const desired = values.tenureMonths || 0
    if (fields.length === desired) return
    const next = Array.from({ length: desired }, (_, i) => ({
      period: i + 1,
      plannedAmount: fields[i]?.plannedAmount ?? '0',
    }))
    replace(next)
  }, [values.repaymentType, values.tenureMonths, fields, replace])

  const highRate = useMemo(() => {
    const r = Number(values.monthlyRate)
    return Number.isFinite(r) && r > HIGH_RATE_THRESHOLD
  }, [values.monthlyRate])

  const onSubmit = handleSubmit((data) => {
    setFormError(null)
    startTransition(async () => {
      const result =
        mode === 'create' ? await createLoan(data) : await updateLoan(loanId!, data)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, msg] of Object.entries(result.fieldErrors)) {
            setError(key as never, { message: msg })
          }
        }
        setFormError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(mode === 'create' ? 'Loan created' : 'Loan saved')
      router.push(mode === 'create' ? `/borrowers/${data.borrowerId}` : `/loans/${loanId}`)
      router.refresh()
    })
  })

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={onSubmit} className="space-y-6 lg:col-span-3" noValidate>
        {formError ? (
          <p role="alert" className="border-destructive/40 text-destructive rounded-md border bg-red-50 px-3 py-2 text-sm">
            {formError}
          </p>
        ) : null}

        <Field
          id="borrowerId"
          label="Borrower"
          error={errors.borrowerId?.message}
          hint={mode === 'edit' ? "A loan's borrower can't be changed after it's created." : undefined}
        >
          <Controller
            control={control}
            name="borrowerId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? '')}
                disabled={mode === 'edit'}
              >
                <SelectTrigger id="borrowerId">
                  <SelectValue placeholder="Choose a borrower">
                    {(v) =>
                      borrowers.find((b) => b.id === String(v))?.name ?? 'Choose a borrower'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {borrowers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="principal"
            label="Principal"
            error={errors.principal?.message}
            hint={editingLocked?.principal ? 'Locked because payments exist.' : undefined}
          >
            <Controller
              control={control}
              name="principal"
              render={({ field }) => (
                <MoneyInput
                  id="principal"
                  disabled={editingLocked?.principal}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </Field>
          <Field
            id="monthlyRate"
            label="Monthly rate (%)"
            error={errors.monthlyRate?.message}
            hint={
              editingLocked?.monthlyRate
                ? 'Locked because payments exist.'
                : highRate
                  ? `Warning: ${values.monthlyRate}% per month is high — Philippine courts may reduce rates they find unconscionable.`
                  : undefined
            }
          >
            <Input
              id="monthlyRate"
              inputMode="decimal"
              disabled={editingLocked?.monthlyRate}
              {...register('monthlyRate')}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="tenureMonths" label="Tenure (months)" error={errors.tenureMonths?.message}>
            <Input
              id="tenureMonths"
              type="number"
              min={1}
              max={120}
              {...register('tenureMonths', { valueAsNumber: true })}
            />
          </Field>
          <Field
            id="startDate"
            label="Start date"
            error={errors.startDate?.message}
            hint={editingLocked?.startDate ? 'Locked because payments exist.' : undefined}
          >
            <Input
              id="startDate"
              type="date"
              disabled={editingLocked?.startDate}
              {...register('startDate')}
            />
          </Field>
          <Field id="graceDays" label="Grace days" error={errors.graceDays?.message}>
            <Input
              id="graceDays"
              type="number"
              min={0}
              max={365}
              {...register('graceDays', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            id="interestMethod"
            label="Interest method"
            error={errors.interestMethod?.message}
            hint={editingLocked?.interestMethod ? 'Locked because payments exist.' : undefined}
          >
            <Controller
              control={control}
              name="interestMethod"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange((v ?? 'compound') as (typeof INTEREST_METHODS)[number])
                  }
                  disabled={editingLocked?.interestMethod}
                >
                  <SelectTrigger id="interestMethod">
                    <SelectValue>{(v) => (v === 'simple' ? 'Simple' : 'Compound')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m === 'compound' ? 'Compound' : 'Simple'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="repaymentType" label="Repayment type" error={errors.repaymentType?.message}>
            <Controller
              control={control}
              name="repaymentType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange((v ?? 'equal_installments') as (typeof REPAYMENT_TYPES)[number])
                  }
                >
                  <SelectTrigger id="repaymentType">
                    <SelectValue>
                      {(v) =>
                        v === 'lump_sum'
                          ? 'Lump sum at maturity'
                          : v === 'custom'
                            ? 'Custom schedule'
                            : 'Equal installments'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal_installments">Equal installments</SelectItem>
                    <SelectItem value="lump_sum">Lump sum at maturity</SelectItem>
                    <SelectItem value="custom">Custom schedule</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="afterMaturity" label="After maturity" error={errors.afterMaturity?.message}>
            <Controller
              control={control}
              name="afterMaturity"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange((v ?? 'continue_accruing') as (typeof AFTER_MATURITY)[number])
                  }
                >
                  <SelectTrigger id="afterMaturity">
                    <SelectValue>
                      {(v) => (v === 'stop_accruing' ? 'Stop accruing' : 'Keep accruing')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continue_accruing">Keep accruing</SelectItem>
                    <SelectItem value="stop_accruing">Stop accruing</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        {values.repaymentType === 'custom' ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom schedule</div>
            <p className="text-muted-foreground text-xs">
              Amount planned for each period. The last period is auto-adjusted to close the balance.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-10 text-xs">#{i + 1}</span>
                  <Controller
                    control={control}
                    name={`customSchedule.${i}.plannedAmount` as const}
                    render={({ field }) => (
                      <MoneyInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
            {errors.customSchedule ? (
              <p role="alert" className="text-destructive text-xs">
                {errors.customSchedule.message ?? 'Fix the custom schedule.'}
              </p>
            ) : null}
          </div>
        ) : null}

        <Field id="referenceNo" label="Reference no." optional error={errors.referenceNo?.message}>
          <Input id="referenceNo" {...register('referenceNo')} />
        </Field>

        <Field id="notes" label="Notes" optional error={errors.notes?.message}>
          <Textarea id="notes" rows={3} {...register('notes')} />
        </Field>

        <div className="flex items-start gap-3 rounded-md border p-3">
          <Checkbox
            id="agreementInWriting"
            checked={!!values.agreementInWriting}
            onCheckedChange={(v) =>
              setValue('agreementInWriting', v === true, { shouldValidate: true })
            }
          />
          <label htmlFor="agreementInWriting" className="text-xs">
            <span className="font-medium">Interest terms are in a signed written agreement.</span>{' '}
            <span className="text-muted-foreground">
              Required by Civil Code Art. 1956/1959 for interest and compounding to be enforceable.
            </span>
            {errors.agreementInWriting ? (
              <span className="text-destructive mt-1 block text-xs">
                {errors.agreementInWriting.message}
              </span>
            ) : null}
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Saving…
              </>
            ) : mode === 'create' ? (
              'Create loan'
            ) : (
              'Save changes'
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-4">
          <div className="mb-2 text-sm font-medium">Preview</div>
          <LoanPreview
            principal={values.principal || '0'}
            monthlyRate={values.monthlyRate || '0'}
            tenureMonths={values.tenureMonths || 0}
            startDate={values.startDate}
            interestMethod={values.interestMethod}
            repaymentType={values.repaymentType}
            afterMaturity={values.afterMaturity}
            graceDays={values.graceDays || 0}
            customSchedule={
              values.repaymentType === 'custom' ? (values.customSchedule ?? []) : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
