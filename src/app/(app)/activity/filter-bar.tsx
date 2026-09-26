'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  from: string
  to: string
  entity: string
  action: string
}

const ENTITY_OPTIONS = ['', 'borrower', 'loan', 'payment', 'loan_custom_schedule'] as const
const ACTION_OPTIONS = ['', 'create', 'update', 'delete'] as const

export function ActivityFilterBar({ from, to, entity, action }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const next = new URLSearchParams(params.toString())
    for (const key of ['from', 'to', 'entity', 'action'] as const) {
      const value = form.get(key)
      if (typeof value === 'string' && value.length > 0) next.set(key, value)
      else next.delete(key)
    }
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <form
      key={`${from}-${to}-${entity}-${action}`}
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-md border p-3"
    >
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">
          From
        </Label>
        <Input id="from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          To
        </Label>
        <Input id="to" name="to" type="date" defaultValue={to} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="entity" className="text-xs">
          Entity
        </Label>
        <select
          id="entity"
          name="entity"
          defaultValue={entity}
          className="border-input rounded-md border px-3 py-2 text-sm"
        >
          {ENTITY_OPTIONS.map((e) => (
            <option key={e || 'all'} value={e}>
              {e ? e : 'All'}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="action" className="text-xs">
          Action
        </Label>
        <select
          id="action"
          name="action"
          defaultValue={action}
          className="border-input rounded-md border px-3 py-2 text-sm"
        >
          {ACTION_OPTIONS.map((a) => (
            <option key={a || 'all'} value={a}>
              {a ? a : 'All'}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  )
}
