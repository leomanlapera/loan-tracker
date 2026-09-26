'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MoreHorizontal, Eye, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PaymentDialog } from './[id]/payment-dialog'

interface Props {
  loanId: string
  disabled?: boolean
}

export function LoanRowActions({ loanId, disabled }: Props) {
  const [paymentOpen, setPaymentOpen] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Loan actions" />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setPaymentOpen(true)}
            disabled={disabled}
          >
            <Plus className="size-4" aria-hidden />
            Log payment
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href={`/loans/${loanId}`} />}>
            <Eye className="size-4" aria-hidden />
            Open loan
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/loans/${loanId}/edit`} />}>
            <Pencil className="size-4" aria-hidden />
            Edit loan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        mode="create"
        loanId={loanId}
      />
    </>
  )
}
