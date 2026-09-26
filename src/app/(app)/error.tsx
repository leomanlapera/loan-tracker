'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2 text-base">
          <AlertTriangle className="size-5" aria-hidden />
          Something went wrong loading this page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          The rest of the app is fine. Retry, or navigate somewhere else via the sidebar.
        </p>
        {error.digest ? (
          <div className="text-muted-foreground text-xs">
            Error ID: <code className="bg-muted rounded px-1.5 py-0.5 font-mono">{error.digest}</code>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={reset}>Try again</Button>
        </div>
      </CardContent>
    </Card>
  )
}
