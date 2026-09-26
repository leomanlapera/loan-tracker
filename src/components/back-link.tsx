import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'cn'

interface Props {
  href: string
  children: ReactNode
  className?: string
}

/**
 * Standard "back" link used at the top of detail / nested pages.
 * Icon + label, muted by default, clearer than the previous "← Text" character.
 */
export function BackLink({ href, children, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors',
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      <span>{children}</span>
    </Link>
  )
}
