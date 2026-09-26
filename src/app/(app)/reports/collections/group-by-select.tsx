'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { GroupBy } from '@/lib/reports/collections'

interface Props {
  value: GroupBy
}

export function GroupBySelect({ value }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const onChange = (next: string) => {
    const search = new URLSearchParams(params.toString())
    search.set('groupBy', next)
    router.push(`${pathname}?${search.toString()}`)
  }

  return (
    <div className="space-y-1">
      <label htmlFor="groupBy" className="text-xs font-medium">
        Group by
      </label>
      <select
        id="groupBy"
        name="groupBy"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input rounded-md border px-3 py-2 text-sm"
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
    </div>
  )
}
