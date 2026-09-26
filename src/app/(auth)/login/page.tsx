'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'
import { loginAction, type ActionState } from '@/app/(auth)/actions'
import { FormMessage } from '@/components/auth/form-message'
import { SubmitButton } from '@/components/auth/submit-button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(loginAction, null)
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <LockKeyhole className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground max-w-xs text-sm">
          Sign in to Loan Tracker to manage your borrowers, loans, and payments.
        </p>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <FormMessage state={state} />
            <input type="hidden" name="next" value={next} />

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/reset-password"
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="At least 8 characters"
                required
              />
            </div>

            <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        Loan Tracker is invite-only. If you don&apos;t have an account, ask the person who set
        up this workspace to invite you.
      </p>
    </div>
  )
}
