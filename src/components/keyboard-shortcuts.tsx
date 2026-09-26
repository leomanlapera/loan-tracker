'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Global keyboard shortcuts.
 *   n — context-aware "new" (borrowers → /borrowers/new, loans → /loans/new,
 *       dashboard → /loans/new)
 *   / — focus first visible <input type="text" | "search"> on the page
 *   ? — open this cheatsheet
 *
 * Skipped when the user is typing inside an input, textarea, select, or
 * contenteditable element (so hitting "n" inside a note field types "n").
 *
 * The cheatsheet can also be opened programmatically by dispatching the
 * `shortcuts:open` window event — used by the mobile "More" sheet.
 */
export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)

  useEffect(() => {
    const isTyping = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (target.isContentEditable) return true
      return false
    }

    const focusSearch = () => {
      const candidates = document.querySelectorAll<HTMLInputElement>(
        'input[type="search"], input[type="text"], input[placeholder*="Search" i]',
      )
      for (const el of Array.from(candidates)) {
        if (el.offsetParent !== null) {
          el.focus()
          el.select()
          return true
        }
      }
      return false
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e.target)) return

      if (e.key === '/') {
        if (focusSearch()) e.preventDefault()
      } else if (e.key === '?') {
        e.preventDefault()
        setCheatsheetOpen(true)
      } else if (e.key === 'n' || e.key === 'N') {
        let href: string | null = null
        if (pathname.startsWith('/borrowers')) href = '/borrowers/new'
        else if (pathname.startsWith('/loans') || pathname === '/dashboard')
          href = '/loans/new'
        if (href) {
          e.preventDefault()
          router.push(href)
        }
      }
    }

    const onOpen = () => setCheatsheetOpen(true)

    window.addEventListener('keydown', onKey)
    window.addEventListener('shortcuts:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('shortcuts:open', onOpen)
    }
  }, [pathname, router])

  return <ShortcutsCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
}

interface Shortcut {
  keys: string[]
  label: string
  hint?: string
}

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], label: 'Open command palette', hint: 'Ctrl+K on Windows' },
      { keys: ['/'], label: 'Focus the search input on the current page' },
      { keys: ['?'], label: 'Show this cheatsheet' },
    ],
  },
  {
    title: 'Actions',
    items: [
      {
        keys: ['n'],
        label: 'New (context-aware)',
        hint: 'Borrowers → new borrower; Loans / Dashboard → new loan',
      },
    ],
  },
]

function ShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                {g.title}
              </h3>
              <ul className="space-y-2">
                {g.items.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div>{s.label}</div>
                      {s.hint ? (
                        <div className="text-muted-foreground text-xs">{s.hint}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
