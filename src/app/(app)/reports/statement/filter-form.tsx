'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Printer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterField, HiddenLabel } from '@/components/reports/filter-field'

interface Props {
  borrowers: { id: string; name: string }[]
  initialBorrowerId: string
  initialFrom: string
  initialTo: string
}

const UNSET = '__none'

export function StatementFilterForm({
  borrowers,
  initialBorrowerId,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [borrowerId, setBorrowerId] = useState(initialBorrowerId || UNSET)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const search = new URLSearchParams()
    if (borrowerId && borrowerId !== UNSET) search.set('borrowerId', borrowerId)
    const from = String(form.get('from') ?? '')
    const to = String(form.get('to') ?? '')
    if (from) search.set('from', from)
    if (to) search.set('to', to)
    router.push(`${pathname}?${search.toString()}`)
  }

  const exportHref = (() => {
    if (!borrowerId || borrowerId === UNSET) return null
    const search = new URLSearchParams()
    search.set('borrowerId', borrowerId)
    search.set('from', initialFrom)
    search.set('to', initialTo)
    return `/reports/statement/export?${search.toString()}`
  })()

  return (
    <form
      key={`${initialBorrowerId}-${initialFrom}-${initialTo}`}
      onSubmit={onSubmit}
      className="print-hide flex flex-wrap gap-3 rounded-md border p-3 [&>*]:w-full sm:[&>*]:w-40"
    >
      <FilterField id="borrowerId" label="Borrower" className="sm:!w-56">
        <Select value={borrowerId} onValueChange={(v) => setBorrowerId(v ?? UNSET)}>
          <SelectTrigger id="borrowerId" className="h-8 w-full">
            <SelectValue placeholder="Choose a borrower">
              {(v) =>
                v === UNSET
                  ? 'Choose a borrower'
                  : (borrowers.find((b) => b.id === String(v))?.name ?? 'Choose a borrower')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>Choose a borrower</SelectItem>
            {borrowers.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
      <FilterField id="from" label="From">
        <Input id="from" name="from" type="date" defaultValue={initialFrom} className="h-8 w-full" />
      </FilterField>
      <FilterField id="to" label="To">
        <Input id="to" name="to" type="date" defaultValue={initialTo} className="h-8 w-full" />
      </FilterField>
      <FilterField label={<HiddenLabel>Apply</HiddenLabel>} className="sm:!w-auto">
        <Button type="submit" variant="outline" className="h-8 w-full sm:w-auto">
          Apply
        </Button>
      </FilterField>
      {exportHref ? (
        <>
          <FilterField
            label={<HiddenLabel>Print</HiddenLabel>}
            className="sm:!ml-auto sm:!w-auto"
          >
            <Button
              type="button"
              variant="outline"
              className="h-8 w-full sm:w-auto"
              onClick={() => window.print()}
            >
              <Printer className="size-4 shrink-0" aria-hidden />
              Print
            </Button>
          </FilterField>
          <FilterField
            label={<HiddenLabel>Download CSV</HiddenLabel>}
            className="sm:!w-auto"
          >
            <a href={exportHref}>
              <Button type="button" className="h-8 w-full sm:w-auto">
                Download CSV
              </Button>
            </a>
          </FilterField>
        </>
      ) : null}
    </form>
  )
}
