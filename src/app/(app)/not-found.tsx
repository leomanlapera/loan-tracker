import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'

export default function NotFound() {
  return (
    <Card>
      <CardContent>
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="This page doesn't exist. It may have been moved, or the record was deleted. Try one of the shortcuts below or open the command palette (⌘K)."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/dashboard">
                <Button>Go to dashboard</Button>
              </Link>
              <Link href="/loans">
                <Button variant="outline">Loans</Button>
              </Link>
              <Link href="/borrowers">
                <Button variant="outline">Borrowers</Button>
              </Link>
            </div>
          }
        />
      </CardContent>
    </Card>
  )
}
