'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { SiteFooter } from '@/components/site-footer'
import { signOutAction } from '@/app/(auth)/actions'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/borrowers', label: 'Borrowers', icon: Users },
  { href: '/loans', label: 'Loans', icon: CreditCard },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/activity', label: 'Activity', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

const STORAGE_KEY = 'loan-tracker.sidebar.open'

interface Props {
  userEmail: string
  children: ReactNode
}

export function AppShell({ userEmail, children }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)

  // Hydrate saved sidebar state after mount. SSR and first client render both
  // use `true` so hydration matches; the setState below is intentional — it
  // reflects a value that literally can't exist during SSR (localStorage).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(saved === 'true')
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open))
    } catch {}
  }, [open])

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setOpen(false)
  }

  return (
    <div className="relative flex min-h-screen">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r',
          'transition-transform duration-200 will-change-transform',
          !open && '-translate-x-full',
          'md:sticky md:top-0 md:z-0 md:h-screen',
          !open && 'md:hidden',
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold" onClick={closeOnMobile}>
            Loan Tracker
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hover:bg-sidebar-accent rounded-md p-1 md:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 text-sm" aria-label="Primary">
          {NAV.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeOnMobile}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'hover:bg-sidebar-accent/50',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="text-muted-foreground border-t px-4 py-3 text-xs">
          Signed in as
          <div className="text-foreground truncate text-sm font-medium">{userEmail}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="hover:bg-muted rounded-md p-2"
              aria-label={open ? 'Hide navigation' : 'Show navigation'}
              aria-expanded={open}
              aria-controls="primary-navigation"
            >
              <Menu className="size-4" />
            </button>
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <span className="hidden sm:inline">{userEmail}</span>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main
          id="primary-navigation"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6"
        >
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
