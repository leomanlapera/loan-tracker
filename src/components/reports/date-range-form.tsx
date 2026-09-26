'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  initialFrom: string
  initialTo: string
  exportPath: string
  extraFilters?: React.ReactNode
}

export function DateRangeForm({ initialFrom, initialTo, exportPath, extraFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const next = new URLSearchParams(params.toString())
    next.set('from', String(form.get('from') ?? initialFrom))
    next.set('to', String(form.get('to') ?? initialTo))
    router.push(`${pathname}?${next.toString()}`)
  }

  const exportHref = (() => {
    const next = new URLSearchParams(params.toString())
    next.set('from', initialFrom)
    next.set('to', initialTo)
    return `${exportPath}?${next.toString()}`
  })()

  return (
    <form
      key={`${initialFrom}-${initialTo}`}
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-md border p-3"
    >
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">
          From
        </Label>
        <Input id="from" name="from" type="date" defaultValue={initialFrom} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          To
        </Label>
        <Input id="to" name="to" type="date" defaultValue={initialTo} />
      </div>
      {extraFilters}
      <Button type="submit" variant="outline">
        Apply
      </Button>
      <a href={exportHref} className="ml-auto">
        <Button type="button">Download CSV</Button>
      </a>
    </form>
  )
}
