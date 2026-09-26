'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { formatDate, formatPHP } from '@/lib/format'
import { paymentMethodLabels, type PaymentMethod } from '@/lib/validation/payment'
import { softDeletePayment, restorePayment } from '../payment-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaymentDialog } from './payment-dialog'

export interface PaymentRow {
  id: string
  amount: string
  paidOn: string
  method: PaymentMethod
  referenceNo: string | null
  note: string | null
  deletedAt: string | null
}

interface Props {
  loanId: string
  payments: PaymentRow[]
}

export function PaymentLog({ loanId, payments }: Props) {
  const router = useRouter()
  const [showDeleted, setShowDeleted] = useState(false)
  const [editing, setEditing] = useState<PaymentRow | null>(null)
  const [pending, startTransition] = useTransition()
  const [rowError, setRowError] = useState<string | null>(null)

  const visible = useMemo(
    () => (showDeleted ? payments : payments.filter((p) => !p.deletedAt)),
    [payments, showDeleted],
  )

  const doDelete = (paymentId: string) =>
    startTransition(async () => {
      setRowError(null)
      const r = await softDeletePayment(loanId, paymentId)
      if (!r.ok) setRowError(r.error)
      else router.refresh()
    })

  const doRestore = (paymentId: string) =>
    startTransition(async () => {
      setRowError(null)
      const r = await restorePayment(loanId, paymentId)
      if (!r.ok) setRowError(r.error)
      else router.refresh()
    })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Show deleted
        </label>
        {rowError ? <span className="text-destructive text-xs">{rowError}</span> : null}
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Ref / note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                  No payments logged yet.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => (
                <TableRow key={p.id} className={p.deletedAt ? 'opacity-50' : undefined}>
                  <TableCell>
                    <div>{formatDate(p.paidOn)}</div>
                    {p.deletedAt ? (
                      <Badge variant="outline" className="mt-1">
                        deleted
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPHP(p.amount)}
                  </TableCell>
                  <TableCell>{paymentMethodLabels[p.method]}</TableCell>
                  <TableCell className="text-sm">
                    <div className="text-muted-foreground">
                      {p.referenceNo || '—'}
                    </div>
                    {p.note ? <div className="text-xs">{p.note}</div> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.deletedAt ? (
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => doRestore(p.id)}>
                        Restore
                      </Button>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() => doDelete(p.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaymentDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        mode="edit"
        loanId={loanId}
        payment={editing ?? undefined}
      />
    </div>
  )
}
