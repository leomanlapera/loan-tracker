import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  )
}
