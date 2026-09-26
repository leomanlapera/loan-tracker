'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  paymentSchema,
  PAYMENT_METHODS,
  paymentMethodLabels,
  type PaymentInput,
  type PaymentMethod,
} from '@/lib/validation/payment'
import {
  createPayment,
  updatePayment,
  computePayoff,
} from '../payment-actions'
import { Field } from '@/components/form/field'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  loanId: string
  payment?: {
    id: string
    amount: string
    paidOn: string
    method: PaymentMethod
    referenceNo: string | null
    note: string | null
  }
}

const defaults = (): PaymentInput => ({
  amount: '',
  paidOn: format(new Date(), 'yyyy-MM-dd'),
  method: 'cash',
  referenceNo: null,
  note: null,
})

export function PaymentDialog({ open, onOpenChange, mode, loanId, payment }: Props) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: defaults(),
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    if (mode === 'edit' && payment) {
      reset({
        amount: payment.amount,
        paidOn: payment.paidOn,
        method: payment.method,
        referenceNo: payment.referenceNo,
        note: payment.note,
      })
    } else {
      reset(defaults())
    }
  }, [open, mode, payment, reset])

  const fillPayoff = () => {
    startTransition(async () => {
      const paidOn = watch('paidOn') || format(new Date(), 'yyyy-MM-dd')
      const r = await computePayoff(loanId, paidOn)
      if (r.ok && r.amount) {
        setValue('amount', r.amount, { shouldValidate: true })
      } else {
        setFormError(r.error ?? 'Could not compute payoff.')
      }
    })
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createPayment(loanId, values)
          : await updatePayment(loanId, payment!.id, values)
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [key, msg] of Object.entries(result.fieldErrors)) {
            setError(key as keyof PaymentInput, { message: msg })
          }
        }
        setFormError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(mode === 'create' ? 'Payment logged' : 'Payment updated')
      onOpenChange(false)
      router.refresh()
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Log payment' : 'Edit payment'}</DialogTitle>
          <DialogDescription>
            Payments are allocated to accrued interest first, then principal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError ? (
            <p role="alert" className="border-destructive/40 text-destructive rounded-md border bg-red-50 px-3 py-2 text-xs">
              {formError}
            </p>
          ) : null}

          <Field id="amount" label="Amount" error={errors.amount?.message}>
            <div className="flex gap-2">
              <MoneyInput id="amount" {...register('amount')} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillPayoff}
                disabled={isPending}
              >
                Pay off
              </Button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="paidOn" label="Date paid" error={errors.paidOn?.message}>
              <Input id="paidOn" type="date" {...register('paidOn')} />
            </Field>
            <Field id="method" label="Method" error={errors.method?.message}>
              <Select
                value={watch('method')}
                onValueChange={(v) =>
                  setValue('method', (v ?? 'cash') as PaymentMethod, { shouldValidate: true })
                }
              >
                <SelectTrigger id="method">
                  <SelectValue>
                    {(v) => paymentMethodLabels[(v as PaymentMethod) ?? 'cash'] ?? 'Cash'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {paymentMethodLabels[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field id="referenceNo" label="Reference no." optional error={errors.referenceNo?.message}>
            <Input id="referenceNo" {...register('referenceNo')} />
          </Field>

          <Field id="note" label="Note" optional error={errors.note?.message}>
            <Textarea id="note" rows={2} {...register('note')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : mode === 'create' ? 'Log payment' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
