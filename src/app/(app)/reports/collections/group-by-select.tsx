'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GroupBy } from '@/lib/reports/collections'

interface Props {
  value: GroupBy
}

const OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const LABELS: Record<string, string> = Object.fromEntries(OPTIONS.map((o) => [o.value, o.label]))

export function GroupBySelect({ value }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const onChange = (next: string | null) => {
    if (!next) return
    const search = new URLSearchParams(params.toString())
    search.set('groupBy', next)
    router.push(`${pathname}?${search.toString()}`)
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="groupBy" className="text-xs">
        Group by
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="groupBy" className="min-w-32">
          <SelectValue>{(v) => LABELS[String(v ?? 'month')] ?? 'Month'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
