'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ComponentType } from 'react'
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Keyboard,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from 'cn'
import { signOutAction } from '@/app/(auth)/actions'
import { GlobalLogPaymentButton } from '@/components/global-log-payment'
import { ThemeToggle } from '@/components/theme'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TabItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

const TABS: TabItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/loans', label: 'Loans', icon: CreditCard },
  // The center slot is the raised "Log payment" button — not a nav tab.
  { href: '/borrowers', label: 'Borrowers', icon: Users },
  // Last slot is the "More" sheet — not a route.
]

const MORE: TabItem[] = [
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/activity', label: 'Activity', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface Props {
  userEmail: string
}

export function MobileNav({ userEmail }: Props) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
  const isMoreActive = MORE.some((m) => isActive(m.href))

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'bg-background/95 fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t backdrop-blur',
          'supports-backdrop-filter:bg-background/80 md:hidden print-hide',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <TabLink item={TABS[0]} active={isActive(TABS[0].href)} />
        <TabLink item={TABS[1]} active={isActive(TABS[1].href)} />

        <div className="relative flex flex-1 items-center justify-center">
          <GlobalLogPaymentButton
            compact
            className="bg-primary text-primary-foreground hover:bg-primary/90 -mt-8 size-14 rounded-full p-0 shadow-lg"
          />
        </div>

        <TabLink item={TABS[2]} active={isActive(TABS[2].href)} />

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          aria-expanded={moreOpen}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
            isMoreActive || moreOpen
              ? 'text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <MoreHorizontal className="size-5" aria-hidden />
          <span>More</span>
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
          </DialogHeader>

          <ul className="-mx-1 space-y-1">
            {MORE.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <DialogClose
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                          active
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-accent/50',
                        )}
                      />
                    }
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </DialogClose>
                </li>
              )
            })}
          </ul>

          <div className="border-t pt-3">
            <div className="text-muted-foreground px-3 pb-2 text-xs">
              Signed in as
              <div className="text-foreground truncate text-sm font-medium">
                {userEmail}
              </div>
            </div>
            <ThemeToggle className="hover:bg-accent w-full justify-start gap-3 px-3 py-2 text-sm" />
            <DialogClose
              render={
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new Event('shortcuts:open'))
                  }
                  className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                />
              }
            >
              <Keyboard className="size-4 shrink-0" aria-hidden />
              <span>Keyboard shortcuts</span>
            </DialogClose>
            <form action={signOutAction}>
              <button
                type="submit"
                className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TabLink({ item, active }: { item: TabItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
        active
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="size-5" aria-hidden />
      <span>{item.label}</span>
    </Link>
  )
}

