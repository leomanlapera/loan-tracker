'use client'

import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from 'cn'
import { Input } from './input'

type Props = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>

/**
 * Password input with a show/hide eye toggle.
 * Keeps native <input> semantics + register(...) compat with react-hook-form.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        {...props}
        className={cn('pr-9', className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-1 flex w-7 items-center justify-center rounded-md transition-colors"
      >
        <Icon className="size-4" aria-hidden />
      </button>
    </div>
  )
})
