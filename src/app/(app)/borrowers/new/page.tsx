import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BorrowerForm } from '../borrower-form'

export default function NewBorrowerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/borrowers" className="text-muted-foreground text-sm hover:underline">
          ← Borrowers
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New borrower</CardTitle>
        </CardHeader>
        <CardContent>
          <BorrowerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
