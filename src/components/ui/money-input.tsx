'use client'

import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from 'cn'
import { Input } from './input'

type Props = ComponentPropsWithoutRef<typeof Input>

/**
 * Money input with a ₱ prefix inside the field. Keeps the raw string in the
 * underlying <input>, so react-hook-form register(...) works unchanged.
 */
export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm select-none"
      >
        ₱
      </span>
      <Input
        ref={ref}
        inputMode="decimal"
        {...props}
        className={cn('pl-6 tabular-nums', className)}
      />
    </div>
  )
})
