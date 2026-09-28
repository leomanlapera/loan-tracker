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
  HIGH_RATE_THRESHOLD,
} from '@/lib/validation/loan'
import { createLoan, updateLoan } from './actions'
import { Field } from '@/components/form/field'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SegmentedControl } from '@/components/ui/segmented-control'
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

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
    </div>
  )
}

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

  const hasAdvancedError =
    !!errors.graceDays || !!errors.referenceNo || !!errors.notes
  const advancedTouched =
    (values.graceDays ?? 0) > 0 || !!values.referenceNo || !!values.notes

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
      <form onSubmit={onSubmit} className="space-y-8 lg:col-span-3" noValidate>
        {formError ? (
          <p role="alert" className="border-destructive/40 text-destructive rounded-md border bg-red-50 px-3 py-2 text-sm">
            {formError}
          </p>
        ) : null}

        <section className="space-y-5">
          <SectionHeader title="Loan basics" description="Who's borrowing, how much, and when." />

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

          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeader
            title="Interest & repayment"
            description="How interest accrues and how the borrower pays it back."
          />

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
                <SegmentedControl
                  id="interestMethod"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={editingLocked?.interestMethod}
                  options={[
                    { value: 'compound', label: 'Compound' },
                    { value: 'simple', label: 'Simple' },
                  ]}
                />
              )}
            />
          </Field>

          <Field id="repaymentType" label="Repayment type" error={errors.repaymentType?.message}>
            <Controller
              control={control}
              name="repaymentType"
              render={({ field }) => (
                <SegmentedControl
                  id="repaymentType"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'equal_installments', label: 'Equal installments' },
                    { value: 'lump_sum', label: 'Lump sum' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              )}
            />
          </Field>

          <Field id="afterMaturity" label="After maturity" error={errors.afterMaturity?.message}>
            <Controller
              control={control}
              name="afterMaturity"
              render={({ field }) => (
                <SegmentedControl
                  id="afterMaturity"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'continue_accruing', label: 'Keep accruing' },
                    { value: 'stop_accruing', label: 'Stop accruing' },
                  ]}
                />
              )}
            />
          </Field>

          {values.repaymentType === 'custom' ? (
            <div className="space-y-2 rounded-md border p-3">
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
        </section>

        <details
          className="group border-t pt-4"
          open={hasAdvancedError || advancedTouched}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span>Advanced</span>
            <span className="text-muted-foreground text-xs font-normal group-open:hidden">Show</span>
            <span className="text-muted-foreground hidden text-xs font-normal group-open:inline">Hide</span>
          </summary>
          <div className="mt-4 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="graceDays" label="Grace days" error={errors.graceDays?.message}>
                <Input
                  id="graceDays"
                  type="number"
                  min={0}
                  max={365}
                  {...register('graceDays', { valueAsNumber: true })}
                />
              </Field>
              <Field id="referenceNo" label="Reference no." optional error={errors.referenceNo?.message}>
                <Input id="referenceNo" {...register('referenceNo')} />
              </Field>
            </div>

            <Field id="notes" label="Notes" optional error={errors.notes?.message}>
              <Textarea id="notes" rows={3} {...register('notes')} />
            </Field>
          </div>
        </details>

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

        <div className="sticky bottom-16 z-10 flex justify-end gap-3 border-t bg-background/90 py-3 backdrop-blur supports-backdrop-filter:bg-background/70 md:bottom-0">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
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
