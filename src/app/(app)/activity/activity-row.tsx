'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { activityActionLabel, activityEntityLabel } from '@/lib/labels'

export interface ActivityRow {
  id: string
  createdAt: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

const IGNORED_KEYS = new Set(['created_at', 'updated_at', 'user_id', 'id'])

function computeDiff(row: ActivityRow): { field: string; before: unknown; after: unknown }[] {
  const before = row.before ?? {}
  const after = row.after ?? {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const out: { field: string; before: unknown; after: unknown }[] = []
  for (const key of keys) {
    if (IGNORED_KEYS.has(key)) continue
    if (row.action === 'update' && JSON.stringify(before[key]) === JSON.stringify(after[key]))
      continue
    if (row.action === 'create' && (after[key] === null || after[key] === undefined)) continue
    if (row.action === 'delete' && (before[key] === null || before[key] === undefined)) continue
    out.push({ field: key, before: before[key], after: after[key] })
  }
  return out
}

function humanField(key: string): string {
  return key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '∅'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

export function ActivityRowView({ row }: { row: ActivityRow }) {
  const [expanded, setExpanded] = useState(false)
  const diff = computeDiff(row)
  const hasDetails = diff.length > 0

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {format(new Date(row.createdAt), 'MMM d · HH:mm')}
        </span>
        <Badge variant="outline">{activityEntityLabel(row.entityType)}</Badge>
        <Badge
          variant={
            row.action === 'delete'
              ? 'destructive'
              : row.action === 'create'
                ? 'default'
                : 'secondary'
          }
        >
          {activityActionLabel(row.action)}
        </Badge>
        <span className="text-muted-foreground text-xs">
          #{row.entityId.slice(0, 8)}
        </span>
        {hasDetails ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide' : 'Details'}
          </Button>
        ) : null}
      </div>

      {expanded && diff.length > 0 ? (
        <div className="pt-1 text-xs">
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="py-1 pr-3 font-medium">Field</th>
                {row.action !== 'create' ? (
                  <th className="py-1 pr-3 font-medium">Before</th>
                ) : null}
                {row.action !== 'delete' ? (
                  <th className="py-1 font-medium">
                    {row.action === 'update' ? 'After' : 'Value'}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={d.field} className="align-top">
                  <td className="py-1 pr-3">{humanField(d.field)}</td>
                  {row.action !== 'create' ? (
                    <td className="text-muted-foreground py-1 pr-3 font-mono line-through decoration-destructive/50">
                      {fmt(d.before)}
                    </td>
                  ) : null}
                  {row.action !== 'delete' ? (
                    <td className="text-foreground py-1 font-mono">{fmt(d.after)}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
