import { BackLink } from '@/components/back-link'
import { Card, CardContent } from '@/components/ui/card'
import { BorrowerForm } from '../borrower-form'

export default function NewBorrowerPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/borrowers">Borrowers</BackLink>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New borrower</h1>
        <p className="text-sm text-muted-foreground">
          Add the person you&apos;re lending to. You can log loans against them once saved.
        </p>
      </div>
      <Card>
        <CardContent>
          <BorrowerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
