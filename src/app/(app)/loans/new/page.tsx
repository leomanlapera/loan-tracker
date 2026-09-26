import { BackLink } from '@/components/back-link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { LoanForm, type BorrowerOption } from '../loan-form'
import type { InterestMethod, RepaymentType } from '@/lib/engine/types'

export default async function NewLoanPage({
  searchParams,
}: {
  searchParams: Promise<{ borrowerId?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: borrowers = [] }, { data: profile }] = await Promise.all([
    supabase
      .from('borrowers')
      .select('id, full_name, archived_at')
      .is('archived_at', null)
      .order('full_name'),
    supabase
      .from('profiles')
      .select('default_grace_days, default_interest_method, default_repayment_type')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!borrowers || borrowers.length === 0) {
    redirect('/borrowers/new?next=/loans/new')
  }

  const options: BorrowerOption[] = (borrowers ?? []).map((b) => ({
    id: b.id,
    name: b.full_name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/loans">Loans</BackLink>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New loan</h1>
        <p className="text-sm text-muted-foreground">
          Preview updates as you type. Numbers become real once you log payments.
        </p>
      </div>
      <Card>
        <CardContent>
          <LoanForm
            mode="create"
            borrowers={options}
            initial={{
              borrowerId: params.borrowerId,
              graceDays: profile?.default_grace_days ?? 0,
              interestMethod: (profile?.default_interest_method ?? 'compound') as InterestMethod,
              repaymentType: (profile?.default_repayment_type ?? 'equal_installments') as RepaymentType,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
