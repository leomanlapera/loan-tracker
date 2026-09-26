'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { FormEvent, ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterField, HiddenLabel } from './filter-field'

interface Props {
  initialFrom: string
  initialTo: string
  exportPath: string
  extraFilters?: ReactNode
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
      className="flex flex-wrap gap-3 rounded-md border p-3 [&>*]:w-full sm:[&>*]:w-40"
    >
      <FilterField id="from" label="From">
        <Input id="from" name="from" type="date" defaultValue={initialFrom} className="h-8 w-full" />
      </FilterField>
      <FilterField id="to" label="To">
        <Input id="to" name="to" type="date" defaultValue={initialTo} className="h-8 w-full" />
      </FilterField>
      {extraFilters}
      <FilterField label={<HiddenLabel>Apply</HiddenLabel>} className="sm:!w-auto">
        <Button type="submit" variant="outline" className="h-8 w-full sm:w-auto">
          Apply
        </Button>
      </FilterField>
      <FilterField label={<HiddenLabel>Download CSV</HiddenLabel>} className="sm:!ml-auto sm:!w-auto">
        <a href={exportHref}>
          <Button type="button" className="h-8 w-full sm:w-auto">
            Download CSV
          </Button>
        </a>
      </FilterField>
    </form>
  )
}
