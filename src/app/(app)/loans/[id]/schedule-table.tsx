import type { PeriodRow } from '@/lib/engine/types'
import { formatDate, formatPHP } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusVariant: Record<PeriodRow['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  partial: 'secondary',
  unpaid: 'destructive',
  upcoming: 'outline',
}

const statusLabel: Record<PeriodRow['status'], string> = {
  paid: 'paid',
  partial: 'partial',
  unpaid: 'unpaid',
  upcoming: 'upcoming',
}

export function ScheduleTable({ rows }: { rows: PeriodRow[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Opening</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">Scheduled</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Closing</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.period}>
              <TableCell className="text-muted-foreground tabular-nums">{r.period}</TableCell>
              <TableCell>{formatDate(r.dueDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPHP(r.openingBalance.toFixed(2))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPHP(r.interestAccrued.toFixed(2))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.scheduledPayment.gt(0) ? formatPHP(r.scheduledPayment.toFixed(2)) : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.actualPayment.gt(0) ? formatPHP(r.actualPayment.toFixed(2)) : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPHP(r.closingBalance.toFixed(2))}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                  {r.isOverdue ? <Badge variant="destructive">overdue</Badge> : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
