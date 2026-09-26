import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from 'cn'

export interface Crumb {
  href?: string
  label: string
}

interface Props {
  items: Crumb[]
  className?: string
}

/**
 * Breadcrumb trail rendered at the top of detail / nested pages.
 * Pass ordered crumbs; the last one is treated as the current page (no link).
 */
export function Breadcrumbs({ items, className }: Props) {
  if (items.length === 0) return null
  const last = items.length - 1
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1">
        {items.map((c, i) => {
          const isLast = i === last
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast && 'text-foreground font-medium')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {c.label}
                </span>
              )}
              {isLast ? null : (
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
