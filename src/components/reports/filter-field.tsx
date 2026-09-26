import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface Props {
  id?: string
  label: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Consistent label+control cell for every filter bar (activity + reports).
 * The parent `<form>` uses `flex flex-wrap gap-3 [&>*]:w-full sm:[&>*]:w-40`
 * so each FilterField sits full-width on mobile and a fixed 10rem column on
 * desktop. Buttons that shouldn't stretch add `sm:!w-auto` on the outer
 * FilterField.
 */
export function FilterField({ id, label, className, children }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <Label htmlFor={id} className="text-xs leading-4">
        {label}
      </Label>
      {children}
    </div>
  )
}

/**
 * Empty label used to keep buttons on the same baseline as labeled controls.
 * Wrap the button in a FilterField with `label={<HiddenLabel>Apply</HiddenLabel>}`.
 */
export function HiddenLabel({ children }: { children: ReactNode }) {
  return <span className="invisible">{children}</span>
}
