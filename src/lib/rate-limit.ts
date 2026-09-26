import 'server-only'
import { headers } from 'next/headers'

/**
 * In-memory sliding-window rate limiter. Good enough for MVP on a single
 * Vercel serverless function. For horizontal scale (multiple regions or
 * instances), swap the backing map for Upstash Redis — same interface.
 *
 * Keyed by ip + purpose. If ip can't be resolved, falls back to `unknown`
 * which means everyone behind the same proxy shares a bucket — safe default.
 */

interface Bucket {
  hits: number[]
}

const buckets = new Map<string, Bucket>()

async function callerKey(purpose: string): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : (h.get('x-real-ip') ?? 'unknown')
  return `${purpose}:${ip}`
}

export async function rateLimit(
  purpose: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const key = await callerKey(purpose)
  const now = Date.now()
  const cutoff = now - windowMs
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => t > cutoff)
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000)
    buckets.set(key, bucket)
    return { ok: false, retryAfterSeconds }
  }
  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true }
}
