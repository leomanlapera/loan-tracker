'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUpAction, type ActionState } from '@/app/(auth)/actions'
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

export default function SignUpPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signUpAction, null)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Track private loans, log payments, and see what each borrower owes.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <FormMessage state={state} />
          <div className="space-y-2">
            <Label htmlFor="displayName">Your name</Label>
            <Input id="displayName" name="displayName" type="text" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
          <p className="text-xs text-muted-foreground">
            By signing up you agree to the{' '}
            <Link href="/terms" className="underline">
              Terms of use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline">
              Privacy notice
            </Link>
            .
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-6">
          <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
