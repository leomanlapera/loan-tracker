import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FieldProps {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
}

export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {optional ? <span className="text-muted-foreground ml-1 text-xs">(optional)</span> : null}
        </Label>
      </div>
      {children}
      {hint && !error ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
