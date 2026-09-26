import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of use — Loan Tracker',
}

export default function TermsPage() {
  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Terms of use</h1>
        <p className="text-muted-foreground text-sm">
          Effective 2026-09-26. Please read these before using Loan Tracker.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What this is</h2>
        <p className="text-sm">
          Loan Tracker is a record-keeping tool for private lenders. It calculates schedules, tracks
          payments, and generates reports. It is <strong>not</strong> legal or financial advice, and
          the numbers it shows are informational only.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your responsibilities</h2>
        <ul className="ml-6 list-disc space-y-1 text-sm">
          <li>
            You are responsible for the accuracy of everything you enter, including borrower
            information, loan terms, and payment amounts.
          </li>
          <li>
            Philippine Civil Code Art. 1956 requires that interest be expressly agreed in writing.
            Art. 1959 requires the same for compounding. You confirm this in writing on every loan
            you create.
          </li>
          <li>
            Courts may reduce interest rates they find unconscionable. Rates above roughly 6% per
            month have historically been scrutinized.
          </li>
          <li>
            If you lend money as a business, you may fall under the Lending Company Regulation Act
            (RA 9474) and need SEC registration. This tool does not exempt you from that.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Availability and data</h2>
        <p className="text-sm">
          We do our best to keep the service running and backed up (Supabase daily backups; PITR on
          paid tiers) but do not guarantee 100% uptime. Export your data periodically via{' '}
          <em>Settings → Data export</em>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Limitation of liability</h2>
        <p className="text-sm">
          To the fullest extent permitted by law, Loan Tracker and its authors are not liable for
          any losses arising from your use of the app — including but not limited to reliance on
          computed balances, missed payments, or lost data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Changes</h2>
        <p className="text-sm">
          We may update these terms as the app evolves. Material changes will be highlighted in the
          app when you next sign in.
        </p>
      </section>
    </article>
  )
}
