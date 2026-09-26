'use client'

import { useEffect } from 'react'
import { pushRecent, type RecentItem } from '@/lib/recent-history'

interface Props {
  href: string
  label: string
  hint?: string
  kind: RecentItem['kind']
}

/**
 * Fire-and-forget: records the visited item in localStorage so it shows up
 * under "Recent" in the Cmd+K palette. Render inside a server component's
 * page body — it has no visible output.
 */
export function RecentTracker({ href, label, hint, kind }: Props) {
  useEffect(() => {
    pushRecent({ href, label, hint, kind })
  }, [href, label, hint, kind])
  return null
}
