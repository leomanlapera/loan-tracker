'use client'

import { useActionState } from 'react'
import { updatePasswordAction, type ActionState } from '@/app/(auth)/actions'
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

export default function UpdatePasswordPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(updatePasswordAction, null)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Enter a new password to finish resetting your account.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <FormMessage state={state} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
        </CardContent>
        <CardFooter className="pt-6">
          <SubmitButton pendingLabel="Saving…">Save new password</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
