'use client'

import {
  forwardRef,
  useCallback,
  useMemo,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
} from 'react'
import { cn } from 'cn'
import { Input } from './input'

type BaseProps = ComponentPropsWithoutRef<typeof Input>
type Props = Omit<BaseProps, 'value' | 'onChange' | 'type'> & {
  /** Controlled raw numeric string (e.g. "10000.50" — no commas). */
  value?: string
  /** Called with the raw numeric string (no commas). */
  onChange?: (value: string) => void
}

/**
 * Money input with a ₱ prefix and thousands separators shown while typing
 * (`10000.5` renders as `10,000.5`). The raw numeric string (no commas) is
 * what onChange returns and what the underlying <input> reports.
 *
 * Preferred usage is controlled — wrap with react-hook-form's <Controller>
 * so field.value/field.onChange stay in sync with formatted display.
 */
export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { className, value, onChange, ...props },
  ref,
) {
  const display = useMemo(() => formatWithCommas(value ?? ''), [value])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = stripCommas(e.target.value)
      if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return
      onChange?.(raw)
    },
    [onChange],
  )

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
        autoComplete="off"
        value={display}
        onChange={handleChange}
        {...props}
        className={cn('pl-6 tabular-nums', className)}
      />
    </div>
  )
})

export function formatWithCommas(raw: string): string {
  if (!raw) return ''
  const cleaned = stripCommas(raw)
  if (!/^\d*\.?\d*$/.test(cleaned)) return raw
  const [whole, decimal] = cleaned.split('.')
  const wholeWithCommas = whole ? Number(whole).toLocaleString('en-PH') : ''
  return decimal !== undefined ? `${wholeWithCommas}.${decimal}` : wholeWithCommas
}

export function stripCommas(v: string): string {
  return v.replace(/,/g, '')
}
