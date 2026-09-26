'use client'

import { useMemo } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { compute } from '@/lib/engine/compute'
import type {
  InterestMethod,
  RepaymentType,
  AfterMaturity,
  CustomScheduleEntry,
  LoanInput,
  PaymentInput,
} from '@/lib/engine/types'
import { formatPHP } from '@/lib/format'

interface Props {
  loan: {
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
  payments: { amount: string; paidOn: string }[]
}

function toEngineLoan(input: Props['loan'], method: InterestMethod): LoanInput {
  return {
    ...input,
    interestMethod: method,
    startDate: new Date(`${input.startDate}T00:00:00Z`),
  }
}

function toEnginePayments(rows: Props['payments']): PaymentInput[] {
  return rows.map((p) => ({
    amount: p.amount,
    paidOn: new Date(`${p.paidOn}T00:00:00Z`),
  }))
}

export function BalanceChart({ loan, payments }: Props) {
  const data = useMemo(() => {
    try {
      const asOf = new Date()
      const compoundOut = compute({
        loan: toEngineLoan(loan, 'compound'),
        payments: toEnginePayments(payments),
        asOf,
      })
      const simpleOut = compute({
        loan: toEngineLoan(loan, 'simple'),
        payments: toEnginePayments(payments),
        asOf,
      })
      const map = new Map<string, { date: string; compound: number; simple: number }>()
      for (const r of compoundOut.schedule) {
        const key = r.dueDate.toISOString()
        map.set(key, {
          date: format(r.dueDate, 'MMM yyyy'),
          compound: Number(r.closingBalance.toFixed(2)),
          simple: 0,
        })
      }
      for (const r of simpleOut.schedule) {
        const key = r.dueDate.toISOString()
        const existing = map.get(key)
        if (existing) existing.simple = Number(r.closingBalance.toFixed(2))
        else
          map.set(key, {
            date: format(r.dueDate, 'MMM yyyy'),
            compound: 0,
            simple: Number(r.closingBalance.toFixed(2)),
          })
      }
      return Array.from(map.values())
    } catch {
      return []
    }
  }, [loan, payments])

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
        Chart unavailable.
      </div>
    )
  }

  const activeIsCompound = loan.interestMethod === 'compound'

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={80}
            tickFormatter={(v) => formatPHP(v)}
          />
          <Tooltip formatter={(v) => formatPHP(Number(v ?? 0))} labelClassName="text-xs" />
          <Legend />
          <Line
            type="monotone"
            dataKey="compound"
            name={activeIsCompound ? 'Compound (this loan)' : 'Compound (projected)'}
            stroke="hsl(var(--primary))"
            strokeWidth={activeIsCompound ? 2 : 1.25}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="simple"
            name={activeIsCompound ? 'Simple (projected)' : 'Simple (this loan)'}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            strokeWidth={activeIsCompound ? 1.25 : 2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
