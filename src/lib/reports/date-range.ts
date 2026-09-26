import { format, startOfMonth, endOfMonth, startOfYear } from 'date-fns'

export interface DateRange {
  from: string
  to: string
  fromDate: Date
  toDate: Date
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parse ?from=YYYY-MM-DD&to=YYYY-MM-DD with sensible defaults (this calendar year → today).
 * Invalid values fall back to defaults silently — reports should never 500 on a bad query.
 */
export function parseDateRange(
  searchParams: Record<string, string | string[] | undefined>,
  defaults?: { from?: string; to?: string },
): DateRange {
  const today = new Date()
  const fallbackFrom = defaults?.from ?? format(startOfYear(today), 'yyyy-MM-dd')
  const fallbackTo = defaults?.to ?? format(today, 'yyyy-MM-dd')

  const rawFrom = pick(searchParams.from)
  const rawTo = pick(searchParams.to)

  const from = rawFrom && ISO.test(rawFrom) ? rawFrom : fallbackFrom
  const to = rawTo && ISO.test(rawTo) ? rawTo : fallbackTo

  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T23:59:59Z`)
  return { from, to, fromDate, toDate }
}

function pick(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export function monthToDateDefault(): { from: string; to: string } {
  const today = new Date()
  return {
    from: format(startOfMonth(today), 'yyyy-MM-dd'),
    to: format(endOfMonth(today), 'yyyy-MM-dd'),
  }
}
