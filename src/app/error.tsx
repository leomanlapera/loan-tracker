'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
            <AlertTriangle className="size-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            We hit an unexpected error while rendering this page. Try again — if it keeps
            happening, note the error id below.
          </p>
          {error.digest ? (
            <code className="bg-muted rounded px-2 py-1 font-mono text-xs">{error.digest}</code>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
