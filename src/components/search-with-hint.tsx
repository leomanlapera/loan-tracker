'use client'

import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { Search } from 'lucide-react'
import { cn } from 'cn'
import { Input } from '@/components/ui/input'

type Props = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>

/**
 * List-page search input with a leading magnifier icon and a trailing ⌘K hint.
 * The hint reminds users about the global command palette.
 */
export const SearchWithHint = forwardRef<HTMLInputElement, Props>(function SearchWithHint(
  { className, ...props },
  ref,
) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input ref={ref} type="search" {...props} className="pr-14 pl-8" />
      <kbd className="text-muted-foreground border-border bg-muted pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
        ⌘K
      </kbd>
    </div>
  )
})
