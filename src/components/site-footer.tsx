import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          © 2026 Loan Tracker · A record-keeping tool for private lenders in the Philippines.
        </div>
        <div className="flex items-center gap-4">
          <span>Not legal or financial advice.</span>
          <Link href="/reports" className="hover:text-foreground hidden sm:inline">
            Reports
          </Link>
        </div>
      </div>
    </footer>
  )
}
