'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordResetAction, type ActionState } from '@/app/(auth)/actions'
import { FormMessage } from '@/components/auth/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RequestResetPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    requestPasswordResetAction,
    null,
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a link to set a new password.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <FormMessage state={state} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-6">
          <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
          <p className="text-sm text-muted-foreground">
            Remember it?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
