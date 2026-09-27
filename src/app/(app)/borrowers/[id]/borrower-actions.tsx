'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Printer } from 'lucide-react'
import { archiveBorrower, deleteBorrower } from '../actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  borrowerId: string
  archived: boolean
  activeLoanCount: number
}

export function BorrowerActions({ borrowerId, archived, activeLoanCount }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const doArchive = () =>
    startTransition(async () => {
      setError(null)
      const result = await archiveBorrower(borrowerId, !archived)
      if (!result.ok) return setError(result.error)
      router.refresh()
    })

  const doDelete = () =>
    startTransition(async () => {
      setError(null)
      const result = await deleteBorrower(borrowerId)
      if (!result.ok) return setError(result.error)
      router.push('/borrowers')
      router.refresh()
    })

  const canDelete = activeLoanCount === 0

  return (
    <div className="flex items-center gap-2">
      {error ? <span className="text-destructive text-xs">{error}</span> : null}
      <Button variant="outline" onClick={() => window.print()}>
        <Printer aria-hidden />
        Print
      </Button>
      <Button variant="outline" onClick={doArchive} disabled={pending}>
        {archived ? 'Unarchive' : 'Archive'}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger
          disabled={pending || !canDelete}
          title={canDelete ? undefined : 'Archive first — this borrower has active loans.'}
          render={<Button variant="destructive" />}
        >
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this borrower?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the borrower record. Their loan history stays if any exist,
              but you won&apos;t be able to link new loans to them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
