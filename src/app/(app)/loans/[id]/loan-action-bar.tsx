'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cancelLoan, writeOffLoan, reopenLoan } from '../actions'
import { PaymentDialog } from './payment-dialog'

interface Props {
  loanId: string
  status: string
  disableCancel?: boolean
}

export function LoanActionBar({ loanId, status, disableCancel }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const doCancel = () =>
    startTransition(async () => {
      setError(null)
      const r = await cancelLoan(loanId)
      if (!r.ok) return setError(r.error)
      router.refresh()
    })

  const doWriteOff = () =>
    startTransition(async () => {
      setError(null)
      const r = await writeOffLoan(loanId)
      if (!r.ok) return setError(r.error)
      router.refresh()
    })

  const doReopen = () =>
    startTransition(async () => {
      setError(null)
      const r = await reopenLoan(loanId)
      if (!r.ok) return setError(r.error)
      router.refresh()
    })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? <span className="text-destructive text-xs">{error}</span> : null}
      {status === 'active' ? (
        <>
          <Button onClick={() => setOpen(true)}>Log payment</Button>
          <Link href={`/loans/${loanId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="outline" disabled={pending} onClick={doWriteOff}>
            Write off
          </Button>
          <Button
            variant="outline"
            disabled={pending || disableCancel}
            onClick={doCancel}
            title={disableCancel ? 'Cannot cancel — payments exist. Use write off.' : undefined}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Link href={`/loans/${loanId}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          {status !== 'paid' ? (
            <Button variant="outline" disabled={pending} onClick={doReopen}>
              Reopen
            </Button>
          ) : null}
        </>
      )}
      <PaymentDialog open={open} onOpenChange={setOpen} mode="create" loanId={loanId} />
    </div>
  )
}
