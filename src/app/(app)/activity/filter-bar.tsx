'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
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
  from: string
  to: string
  entity: string
  action: string
}

const ENTITY_OPTIONS = [
  { value: '__all', label: 'All entities' },
  { value: 'borrower', label: 'Borrower' },
  { value: 'loan', label: 'Loan' },
  { value: 'payment', label: 'Payment' },
  { value: 'loan_custom_schedule', label: 'Custom schedule' },
] as const

const ACTION_OPTIONS = [
  { value: '__all', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
] as const

const ENTITY_LABELS: Record<string, string> = Object.fromEntries(
  ENTITY_OPTIONS.map((o) => [o.value, o.label]),
)
const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.map((o) => [o.value, o.label]),
)

export function ActivityFilterBar({ from, to, entity, action }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [entityValue, setEntityValue] = useState(entity || '__all')
  const [actionValue, setActionValue] = useState(action || '__all')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const next = new URLSearchParams(params.toString())
    const fromVal = String(form.get('from') ?? '')
    const toVal = String(form.get('to') ?? '')
    if (fromVal) next.set('from', fromVal)
    else next.delete('from')
    if (toVal) next.set('to', toVal)
    else next.delete('to')
    if (entityValue && entityValue !== '__all') next.set('entity', entityValue)
    else next.delete('entity')
    if (actionValue && actionValue !== '__all') next.set('action', actionValue)
    else next.delete('action')
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <form
      key={`${from}-${to}-${entity}-${action}`}
      onSubmit={onSubmit}
      className="flex flex-wrap gap-3 rounded-md border p-3 [&>*]:w-full sm:[&>*]:w-40"
    >
      <FilterField id="from" label="From">
        <Input id="from" name="from" type="date" defaultValue={from} className="h-8 w-full" />
      </FilterField>
      <FilterField id="to" label="To">
        <Input id="to" name="to" type="date" defaultValue={to} className="h-8 w-full" />
      </FilterField>
      <FilterField id="entity" label="Entity">
        <Select value={entityValue} onValueChange={(v) => setEntityValue(v ?? '__all')}>
          <SelectTrigger id="entity" className="h-8 w-full">
            <SelectValue>{(v) => ENTITY_LABELS[String(v ?? '__all')] ?? 'All entities'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ENTITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
      <FilterField id="action" label="Action">
        <Select value={actionValue} onValueChange={(v) => setActionValue(v ?? '__all')}>
          <SelectTrigger id="action" className="h-8 w-full">
            <SelectValue>{(v) => ACTION_LABELS[String(v ?? '__all')] ?? 'All actions'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>
      <FilterField label={<HiddenLabel>Apply</HiddenLabel>} className="sm:!w-auto">
        <Button type="submit" variant="outline" className="h-8 w-full sm:w-auto">
          Apply
        </Button>
      </FilterField>
    </form>
  )
}
