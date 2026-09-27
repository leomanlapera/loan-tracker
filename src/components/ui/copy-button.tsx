'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

interface Props {
  value: string
  label?: string
  className?: string
  size?: 'icon' | 'sm'
}

export function CopyButton({ value, label, className, size = 'icon' }: Props) {
  const [copied, setCopied] = useState(false)
  const ariaLabel = label ? `Copy ${label}` : 'Copy'

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(label ? `${label} copied` : 'Copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === 'icon' ? 'icon-sm' : 'sm'}
      className={cn(className)}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  )
}
