import Link from 'next/link'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/site-footer'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold">
            Loan Tracker
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
