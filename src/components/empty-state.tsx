import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'cn'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

/**
 * Consistent empty-state block for tables and lists.
 * Icon + title + optional description + optional CTA button.
 */
export function EmptyState({ icon: Icon, title, description, action, className, compact }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        compact ? 'py-8' : 'py-12',
        className,
      )}
    >
      {Icon ? (
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="text-foreground text-base font-medium">{title}</div>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
