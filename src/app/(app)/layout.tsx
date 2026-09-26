import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { SiteFooter } from '@/components/site-footer'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/borrowers', label: 'Borrowers' },
  { href: '/loans', label: 'Loans' },
  { href: '/reports', label: 'Reports' },
  { href: '/activity', label: 'Activity' },
  { href: '/settings', label: 'Settings' },
]

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold">
              Loan Tracker
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  )
}
