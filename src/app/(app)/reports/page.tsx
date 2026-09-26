import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const REPORTS = [
  {
    slug: 'portfolio',
    title: 'Portfolio summary',
    description: 'Per-loan snapshot: borrower, principal, rate, balance, total paid, interest earned.',
  },
  {
    slug: 'statement',
    title: 'Borrower statement',
    description: "One borrower's loans, full schedule, and payment history.",
  },
  {
    slug: 'collections',
    title: 'Collections',
    description: 'Payments received in a period, grouped by day/week/month and by method.',
  },
  {
    slug: 'interest',
    title: 'Interest income',
    description: 'Interest portion of payments received, per calendar month.',
  },
  {
    slug: 'aging',
    title: 'Aging / overdue',
    description: 'Overdue amounts bucketed by 1–30, 31–60, 61–90, and 90+ days past due.',
  },
  {
    slug: 'write-offs',
    title: 'Write-offs',
    description: 'Loans marked as written off, with the amount lost.',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Every report supports a date range filter and CSV download.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Link key={r.slug} href={`/reports/${r.slug}`} className="block">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{r.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
