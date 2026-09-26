import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Minimal .env.local loader — good enough for integration tests.
 * Skips lines that are blank or start with #, otherwise splits on the first =.
 */
export function loadEnvLocal(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '')
      if (process.env[key] === undefined) process.env[key] = value
    }
  } catch {
    // .env.local not present — env may still be set another way (CI secrets, shell export)
  }
}

export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var ${name}`)
  return v
}
