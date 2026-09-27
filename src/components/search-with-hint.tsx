'use client'

import { forwardRef, type ComponentPropsWithoutRef, type KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import { cn } from 'cn'
import { Input } from '@/components/ui/input'

type Props = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>

/**
 * List-page search input with a leading magnifier icon and a trailing hint chip.
 * Esc clears the value when the input has content; otherwise ⌘K opens the palette.
 */
export const SearchWithHint = forwardRef<HTMLInputElement, Props>(function SearchWithHint(
  { className, value, onChange, onKeyDown, ...props },
  ref,
) {
  const hasValue = typeof value === 'string' ? value.length > 0 : false

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === 'Escape' && hasValue && onChange) {
      e.preventDefault()
      const target = e.currentTarget
      // Fabricate a change event so parents that expect ChangeEvent<HTMLInputElement>
      // still work — the browser's input.value setter dispatches nothing on its own.
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set
      setter?.call(target, '')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        {...props}
        className="pr-14 pl-8"
      />
      <kbd
        className="text-muted-foreground border-border bg-muted pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline"
        aria-hidden
      >
        {hasValue ? 'Esc' : '⌘K'}
      </kbd>
    </div>
  )
})
