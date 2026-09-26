/**
 * RFC 4180 CSV helpers. Numbers stay unformatted so spreadsheets treat them
 * as numbers, not strings. Dates use ISO yyyy-MM-dd.
 */

export type CsvValue = string | number | boolean | Date | null | undefined

const CRLF = '\r\n'

export function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return isoDate(value)
  const s = String(value)
  const needsQuoting = /[",\r\n]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuoting ? `"${escaped}"` : escaped
}

export function isoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','))
  }
  return lines.join(CRLF) + CRLF
}

export function csvResponse(filename: string, body: string): Response {
  return new Response('﻿' + body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}
