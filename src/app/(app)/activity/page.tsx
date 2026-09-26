import { format, subDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityFilterBar } from './filter-bar'
import { ActivityRowView, type ActivityRow } from './activity-row'

const ENTITY_TYPES = ['borrower', 'loan', 'payment', 'loan_custom_schedule'] as const
const ACTIONS = ['create', 'update', 'delete'] as const

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const today = new Date()
  const from = pickStr(params.from) ?? format(subDays(today, 30), 'yyyy-MM-dd')
  const to = pickStr(params.to) ?? format(today, 'yyyy-MM-dd')
  const rawEntity = pickStr(params.entity) ?? ''
  const rawAction = pickStr(params.action) ?? ''
  const entity = (ENTITY_TYPES as readonly string[]).includes(rawEntity) ? rawEntity : ''
  const action = (ACTIONS as readonly string[]).includes(rawAction) ? rawAction : ''

  const supabase = await createClient()
  let query = supabase
    .from('activity_log')
    .select('id, created_at, entity_type, entity_id, action, before, after')
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (entity) query = query.eq('entity_type', entity as (typeof ENTITY_TYPES)[number])
  if (action) query = query.eq('action', action as (typeof ACTIONS)[number])

  const { data: rows = [] } = await query

  const activity: ActivityRow[] = (rows ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    entityType: r.entity_type,
    entityId: r.entity_id,
    action: r.action as 'create' | 'update' | 'delete',
    before: r.before as Record<string, unknown> | null,
    after: r.after as Record<string, unknown> | null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
        <p className="text-muted-foreground text-sm">
          Every change to borrowers, loans, payments, and custom schedules — captured by database
          triggers so direct SQL edits are logged too.
        </p>
      </div>

      <ActivityFilterBar from={from} to={to} entity={entity} action={action} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {activity.length} event{activity.length === 1 ? '' : 's'}
            {activity.length === 200 ? ' (capped)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No activity in this window. Try widening the date range or clearing filters.
            </p>
          ) : (
            activity.map((row) => <ActivityRowView key={row.id} row={row} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
