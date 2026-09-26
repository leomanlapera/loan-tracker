'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  createPayment,
  computePayoff,
  listActiveLoansForPicker,
  type ActiveLoanOption,
} from '@/app/(app)/loans/payment-actions'
import {
  PAYMENT_METHODS,
  paymentMethodLabels,
  type PaymentMethod,
} from '@/lib/validation/payment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { formatDate, formatPHP } from '@/lib/format'

interface Props {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  compact?: boolean
  className?: string
}

const today = () => format(new Date(), 'yyyy-MM-dd')

export function GlobalLogPaymentButton({
  variant = 'default',
  size = 'default',
  compact = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={className}
        title={compact ? 'Log payment' : undefined}
        aria-label="Log payment"
      >
        <Plus className="size-4 shrink-0" aria-hidden />
        {compact ? null : <span>Log payment</span>}
      </Button>
      <LogPaymentDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function LogPaymentDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [loans, setLoans] = useState<ActiveLoanOption[]>([])
  const [loadingLoans, setLoadingLoans] = useState(false)
  const [search, setSearch] = useState('')
  const [loanId, setLoanId] = useState('')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today())
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [referenceNo, setReferenceNo] = useState('')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    // Reset the form each time the dialog opens. These setState calls are
    // intentional and unconditional — dialog open state is the trigger.
    /* eslint-disable react-hooks/set-state-in-effect */
    setFormError(null)
    setLoanId('')
    setSearch('')
    setAmount('')
    setReferenceNo('')
    setNote('')
    setPaidOn(today())
    setMethod('cash')
    setLoadingLoans(true)
    /* eslint-enable react-hooks/set-state-in-effect */
    listActiveLoansForPicker()
      .then((rows) => setLoans(rows))
      .catch(() => setLoans([]))
      .finally(() => setLoadingLoans(false))
  }, [open])

  const filteredLoans = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return loans
    return loans.filter((l) => l.borrowerName.toLowerCase().includes(q))
  }, [loans, search])

  const selected = loans.find((l) => l.loanId === loanId) ?? null

  const fillPayoff = () => {
    if (!loanId) return
    startTransition(async () => {
      const r = await computePayoff(loanId, paidOn)
      if (r.ok && r.amount) setAmount(r.amount)
      else setFormError(r.error ?? 'Could not compute payoff.')
    })
  }

  const submit = () => {
    setFormError(null)
    if (!loanId) {
      setFormError('Choose a loan.')
      return
    }
    startTransition(async () => {
      const r = await createPayment(loanId, {
        amount,
        paidOn,
        method,
        referenceNo: referenceNo.trim() || null,
        note: note.trim() || null,
      })
      if (!r.ok) {
        setFormError(r.error)
        toast.error(r.error)
        return
      }
      toast.success('Payment logged')
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log payment</DialogTitle>
          <DialogDescription>
            Choose the loan, enter the amount, and submit. Interest is allocated before principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {formError ? (
            <p
              role="alert"
              className="border-destructive/40 text-destructive rounded-md border bg-red-50 px-3 py-2 text-xs"
            >
              {formError}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="loan-search">Loan</Label>
            <Input
              id="loan-search"
              placeholder="Search by borrower name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-52 overflow-y-auto rounded-md border">
              {loadingLoans ? (
                <div className="text-muted-foreground p-3 text-sm">Loading loans…</div>
              ) : filteredLoans.length === 0 ? (
                <div className="text-muted-foreground p-3 text-sm">
                  {loans.length === 0 ? 'No active loans.' : 'No loans match your search.'}
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredLoans.map((l) => {
                    const active = l.loanId === loanId
                    return (
                      <li key={l.loanId}>
                        <button
                          type="button"
                          onClick={() => setLoanId(l.loanId)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm',
                            active ? 'bg-accent' : 'hover:bg-muted',
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{l.borrowerName}</div>
                            <div className="text-muted-foreground text-xs">
                              Balance {formatPHP(l.balance)}
                              {l.nextDueDate
                                ? ` · Next due ${formatDate(l.nextDueDate)} (${formatPHP(l.nextDueAmount)})`
                                : ''}
                            </div>
                          </div>
                          {active ? (
                            <span className="text-primary text-xs font-medium">Selected</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <MoneyInput
                id="amount"
                value={amount}
                onChange={setAmount}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillPayoff}
                disabled={isPending || !loanId}
                title={loanId ? 'Fill exact payoff amount' : 'Choose a loan first'}
              >
                Pay off
              </Button>
            </div>
            {selected ? (
              <p className="text-muted-foreground text-xs">
                Current balance {formatPHP(selected.balance)}.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paidOn">Date paid</Label>
              <Input
                id="paidOn"
                type="date"
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="method">Method</Label>
              <Select
                value={method}
                onValueChange={(v) => setMethod((v ?? 'cash') as PaymentMethod)}
              >
                <SelectTrigger id="method" className="w-full">
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
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="referenceNo">
              Reference no. <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="referenceNo"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || !loanId}>
            {isPending ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Log payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
