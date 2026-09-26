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

const IGNORED_KEYS = new Set(['created_at', 'updated_at'])

function computeDiff(row: ActivityRow): { field: string; before: unknown; after: unknown }[] {
  if (row.action !== 'update') return []
  const before = row.before ?? {}
  const after = row.after ?? {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const out: { field: string; before: unknown; after: unknown }[] = []
  for (const key of keys) {
    if (IGNORED_KEYS.has(key)) continue
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue
    out.push({ field: key, before: before[key], after: after[key] })
  }
  return out
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
  const hasDetails =
    row.action === 'update' ? diff.length > 0 : Boolean(row.before || row.after)

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

      {expanded ? (
        <div className="text-muted-foreground pt-1 text-xs">
          {row.action === 'update' && diff.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-foreground text-left">
                  <th className="py-1 pr-2 font-medium">Field</th>
                  <th className="py-1 pr-2 font-medium">Before</th>
                  <th className="py-1 font-medium">After</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((d) => (
                  <tr key={d.field} className="align-top">
                    <td className="py-1 pr-2 font-mono">{d.field}</td>
                    <td className="py-1 pr-2 font-mono">{fmt(d.before)}</td>
                    <td className="py-1 font-mono">{fmt(d.after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">
              {JSON.stringify(row.after ?? row.before ?? {}, null, 2)}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  )
}
