import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoanForm, type BorrowerOption } from '../loan-form'

export default async function NewLoanPage({
  searchParams,
}: {
  searchParams: Promise<{ borrowerId?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: borrowers = [] } = await supabase
    .from('borrowers')
    .select('id, full_name, archived_at')
    .is('archived_at', null)
    .order('full_name')

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
        <Link href="/loans" className="text-muted-foreground text-sm hover:underline">
          ← Loans
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New loan</h1>
        <p className="text-sm text-muted-foreground">
          Preview updates as you type. Numbers become real once you log payments.
        </p>
      </div>
      <LoanForm mode="create" borrowers={options} initial={{ borrowerId: params.borrowerId }} />
    </div>
  )
}
