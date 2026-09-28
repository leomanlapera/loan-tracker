'use client'

import type { ReactNode } from 'react'
import { cn } from 'cn'

interface Option<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
}

interface Props<T extends string> {
  id?: string
  value: T
  onChange: (value: T) => void
  options: readonly Option<T>[]
  disabled?: boolean
  className?: string
  'aria-labelledby'?: string
}

export function SegmentedControl<T extends string>({
  id,
  value,
  onChange,
  options,
  disabled,
  className,
  'aria-labelledby': ariaLabelledBy,
}: Props<T>) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (disabled) return
    const idx = options.findIndex((o) => o.value === value)
    if (idx < 0) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      for (let i = 1; i <= options.length; i++) {
        const next = options[(idx + i) % options.length]
        if (!next.disabled) {
          onChange(next.value)
          break
        }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      for (let i = 1; i <= options.length; i++) {
        const prev = options[(idx - i + options.length) % options.length]
        if (!prev.disabled) {
          onChange(prev.value)
          break
        }
      }
    }
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKey}
      className={cn(
        'bg-muted/50 inline-flex h-9 w-full items-stretch rounded-md border p-0.5 text-sm',
        disabled && 'opacity-60',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        const isDisabled = disabled || opt.disabled
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={isDisabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-[calc(var(--radius-md)-2px)] px-2 text-xs font-medium transition-colors',
              'focus-visible:ring-ring/50 outline-none focus-visible:ring-2',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              isDisabled && 'cursor-not-allowed hover:text-muted-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
