'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from 'cn'
import { signOutAction } from '@/app/(auth)/actions'
import { GlobalLogPaymentButton } from '@/components/global-log-payment'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'

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

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r print-hide',
          'transition-[width] duration-200 will-change-[width]',
          open ? 'w-56' : 'w-14',
        )}
        aria-label="Primary navigation"
      >
        <div
          className={cn(
            'flex h-14 items-center border-b',
            open ? 'px-4' : 'justify-center px-2',
          )}
        >
          <Link
            href="/dashboard"
            className="truncate text-lg font-semibold"
            title={open ? undefined : 'Loan Tracker'}
          >
            {open ? 'Loan Tracker' : 'LT'}
          </Link>
        </div>

        <div className={cn('border-b p-2', !open && 'flex justify-center')}>
          <GlobalLogPaymentButton
            className={cn(open && 'w-full justify-start')}
            compact={!open}
          />
        </div>

        <nav className="flex-1 space-y-1 p-2 text-sm" aria-label="Primary">
          {NAV.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={open ? undefined : item.label}
                className={cn(
                  'flex items-center gap-3 rounded-md py-2 text-sm transition-colors',
                  open ? 'px-3' : 'justify-center px-0',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'hover:bg-sidebar-accent/50',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {open ? <span className="truncate">{item.label}</span> : null}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t p-2">
          {open ? (
            <div className="text-muted-foreground px-3 py-1 text-xs">
              Signed in as
              <div className="text-foreground truncate text-sm font-medium">
                {userEmail}
              </div>
            </div>
          ) : null}

          <form action={signOutAction}>
            <button
              type="submit"
              title={open ? undefined : `Sign out (${userEmail})`}
              className={cn(
                'hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-md py-2 text-sm transition-colors',
                open ? 'px-3' : 'justify-center px-0',
              )}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              {open ? <span>Sign out</span> : null}
            </button>
          </form>

          <ThemeToggle
            compact={!open}
            className={cn(
              'hover:bg-sidebar-accent hover:text-foreground w-full text-sm',
              open ? 'justify-start gap-3 px-3' : 'justify-center px-0',
            )}
          />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={open}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex w-full items-center gap-3 rounded-md py-2 text-sm transition-colors',
              open ? 'px-3' : 'justify-center px-0',
            )}
          >
            {open ? (
              <>
                <PanelLeftClose className="size-4 shrink-0" aria-hidden />
                <span>Collapse</span>
              </>
            ) : (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="w-full flex-1 px-4 py-6">{children}</main>
      </div>
      <div className="print-hide">
        <CommandPalette />
        <KeyboardShortcuts />
      </div>
    </div>
  )
}
