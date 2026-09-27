import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <Compass className="size-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-sm">
            The page you&apos;re looking for doesn&apos;t exist — it may have moved, or the link
            was mistyped.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
