'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Global keyboard shortcuts.
 *   n — context-aware "new" (borrowers → /borrowers/new, loans → /loans/new,
 *       dashboard → /loans/new)
 *   / — focus first visible <input type="text" | "search"> on the page
 *
 * Skipped when the user is typing inside an input, textarea, select, or
 * contenteditable element (so hitting "n" inside a note field types "n").
 */
export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

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

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname, router])

  return null
}
