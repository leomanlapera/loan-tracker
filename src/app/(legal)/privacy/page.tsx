import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy notice — Loan Tracker',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy notice</h1>
        <p className="text-muted-foreground text-sm">
          Effective 2026-09-26. Complies with the Republic Act No. 10173 (Data Privacy Act of 2012)
          of the Philippines.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What we collect</h2>
        <p className="text-sm">
          When you create a Loan Tracker account we collect the email address you sign up with and a
          bcrypt hash of your password (via Supabase Auth). As you use the app, we store the
          borrowers, loans, payments, and settings you enter — plus a timestamped audit trail of
          those entries.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Where it lives</h2>
        <p className="text-sm">
          All personal data is stored in a Supabase (Postgres) project hosted in Supabase&apos;s
          infrastructure. Every row is protected by Row Level Security so only you can read or
          modify your data. We never share your data with third parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How long we keep it</h2>
        <p className="text-sm">
          Your data is retained until you delete your account. When you delete your account, all
          associated borrowers, loans, payments, and audit rows are cascade-deleted from our
          database. Backups may retain data for up to 30 days per Supabase&apos;s policy.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your rights (RA 10173)</h2>
        <ul className="ml-6 list-disc space-y-1 text-sm">
          <li>
            <strong>Access.</strong> Download every row we hold about you as a ZIP of CSVs from{' '}
            <em>Settings → Data export</em>.
          </li>
          <li>
            <strong>Rectification.</strong> Edit your records directly in the app at any time.
          </li>
          <li>
            <strong>Erasure.</strong> Delete your account from <em>Settings → Danger zone</em>.
          </li>
          <li>
            <strong>Portability.</strong> The CSV export is machine-readable and reusable.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-sm">
          For privacy questions or concerns, reach the account owner listed on this project&apos;s
          repository. Complaints unresolved after 15 days may be escalated to the National Privacy
          Commission at privacy.gov.ph.
        </p>
      </section>
    </article>
  )
}
