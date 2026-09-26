'use client'

import { useMemo } from 'react'
import { compute } from '@/lib/engine/compute'
import type {
  InterestMethod,
  RepaymentType,
  AfterMaturity,
  CustomScheduleEntry,
} from '@/lib/engine/types'
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

interface Props {
  principal: string
  monthlyRate: string
  tenureMonths: number
  startDate: string
  interestMethod: InterestMethod
  repaymentType: RepaymentType
  afterMaturity: AfterMaturity
  graceDays: number
  customSchedule?: CustomScheduleEntry[]
}

export function LoanPreview(props: Props) {
  const result = useMemo(() => {
    try {
      const p = Number(props.principal)
      const r = Number(props.monthlyRate)
      if (!Number.isFinite(p) || p <= 0) return null
      if (!Number.isFinite(r) || r < 0) return null
      if (!props.tenureMonths || props.tenureMonths < 1) return null
      if (!/^\d{4}-\d{2}-\d{2}$/.test(props.startDate)) return null

      const asOf = new Date(`${props.startDate}T00:00:00Z`)
      return compute({
        loan: {
          principal: props.principal,
          monthlyRate: props.monthlyRate,
          tenureMonths: props.tenureMonths,
          startDate: asOf,
          interestMethod: props.interestMethod,
          repaymentType: props.repaymentType,
          afterMaturity: props.afterMaturity,
          graceDays: props.graceDays,
          customSchedule: props.customSchedule,
        },
        payments: [],
        asOf,
      })
    } catch {
      return null
    }
  }, [
    props.principal,
    props.monthlyRate,
    props.tenureMonths,
    props.startDate,
    props.interestMethod,
    props.repaymentType,
    props.afterMaturity,
    props.graceDays,
    props.customSchedule,
  ])

  if (!result) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        Fill in principal, rate, tenure, and start date to see the schedule.
      </div>
    )
  }

  const scheduleRows = result.schedule.slice(0, props.tenureMonths)
  const totalScheduled = scheduleRows.reduce(
    (sum, r) => sum + Number(r.scheduledPayment.toFixed(2)),
    0,
  )
  const totalInterest = scheduleRows.reduce(
    (sum, r) => sum + Number(r.interestAccrued.toFixed(2)),
    0,
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="Maturity" value={formatDate(result.maturityDate)} />
        <Stat label="Total scheduled" value={formatPHP(totalScheduled)} />
        <Stat label="Total interest" value={formatPHP(totalInterest)} />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Closing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduleRows.map((r) => (
              <TableRow key={r.period}>
                <TableCell className="tabular-nums text-muted-foreground">{r.period}</TableCell>
                <TableCell>{formatDate(r.dueDate)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPHP(r.openingBalance.toFixed(2))}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPHP(r.interestAccrued.toFixed(2))}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.scheduledPayment.gt(0) ? formatPHP(r.scheduledPayment.toFixed(2)) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatPHP(r.closingBalance.toFixed(2))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-xs">
        Preview only. Balances recalculate from actual payments once logged.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-semibold tabular-nums">{value}</div>
      <Badge variant="outline" className="mt-2 opacity-0">
        placeholder
      </Badge>
    </div>
  )
}
