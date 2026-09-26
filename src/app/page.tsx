import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold">Loan Tracker</span>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className={buttonVariants()}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
                  Log in
                </Link>
                <Link href="/sign-up" className={buttonVariants()}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Track private loans, cleanly.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Record borrowers, log payments, and see exactly what each borrower owes. Monthly
          compounding or simple interest. Lump sum, installments, or custom.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className={buttonVariants({ size: 'lg' })}>
                Get started
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: 'lg', variant: 'outline' })}
              >
                Log in
              </Link>
            </>
          )}
        </div>
        <p className="text-muted-foreground mt-6 max-w-lg text-xs">
          This app is a record-keeping tool, not legal or financial advice.
        </p>
      </main>
    </div>
  )
}
