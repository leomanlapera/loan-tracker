'use client'

import { useState, useTransition } from 'react'
import { deleteAccountAction } from '@/app/(auth)/actions'
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

export function DangerZone() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const doDelete = () =>
    startTransition(async () => {
      setError(null)
      try {
        await deleteAccountAction()
      } catch (e) {
        setError((e as Error).message)
      }
    })

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Delete your account and every borrower, loan, and payment attached to it. This cannot be
        undone. Data export first (above) if you want a copy.
      </p>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <AlertDialog>
        <AlertDialogTrigger
          disabled={pending}
          render={<Button variant="destructive" />}
        >
          Delete account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your profile and cascade-delete every borrower, loan, payment, and
              activity log row you own. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
