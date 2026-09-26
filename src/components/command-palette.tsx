'use client'

import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CreditCard, Search, Users } from 'lucide-react'
import { cn } from 'cn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  listPaletteEntries,
  type PaletteEntry,
} from '@/app/(app)/command-palette/actions'

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<PaletteEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    // Intentional reset on open — these are the trigger, not derived from state.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true)
    setQuery('')
    setSelectedIndex(0)
    /* eslint-enable react-hooks/set-state-in-effect */
    listPaletteEntries()
      .then((rows) => setEntries(rows))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries.slice(0, 20)
    return entries
      .filter((e) => e.label.toLowerCase().includes(q))
      .slice(0, 20)
  }, [entries, query])

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0)
    }
  }, [filtered, selectedIndex])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[selectedIndex]
      if (item) go(item.href)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!sm:max-w-lg gap-0 !p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Quick search</DialogTitle>
          <DialogDescription>Jump to a borrower or loan</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search borrowers and loans…"
            className="placeholder:text-muted-foreground w-full bg-transparent py-1 text-sm outline-none"
            autoFocus
          />
          <kbd className="text-muted-foreground border-border bg-muted hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {loading ? (
            <div className="text-muted-foreground p-4 text-center text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              {entries.length === 0
                ? 'No borrowers or loans yet.'
                : 'No matches for that search.'}
            </div>
          ) : (
            <ul>
              {filtered.map((e, i) => {
                const Icon = e.kind === 'borrower' ? Users : CreditCard
                const active = i === selectedIndex
                return (
                  <li key={`${e.kind}-${e.id}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => go(e.href)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted',
                      )}
                    >
                      <Icon
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{e.label}</div>
                        {e.hint ? (
                          <div className="text-muted-foreground truncate text-xs">{e.hint}</div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="text-muted-foreground border-t px-3 py-2 text-xs">
          <span>Type to filter, ↑↓ to navigate, ↵ to open,</span>{' '}
          <kbd className="border-border bg-muted mx-1 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{' '}
          <span>anywhere</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
