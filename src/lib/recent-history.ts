'use client'

/**
 * Local "recently viewed" ring buffer for the Cmd+K palette.
 * Stores entry href + display metadata in localStorage, capped at 8 items,
 * most-recent-first.
 */

const KEY = 'loan-tracker.recent-history'
const CAP = 8

export interface RecentItem {
  href: string
  label: string
  hint?: string
  kind: 'borrower' | 'loan' | 'page'
}

export function readRecent(): RecentItem[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecent).slice(0, CAP)
  } catch {
    return []
  }
}

export function pushRecent(item: RecentItem): void {
  try {
    const current = readRecent().filter((r) => r.href !== item.href)
    current.unshift(item)
    window.localStorage.setItem(KEY, JSON.stringify(current.slice(0, CAP)))
  } catch {}
}

function isRecent(v: unknown): v is RecentItem {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as RecentItem).href === 'string' &&
    typeof (v as RecentItem).label === 'string'
  )
}
