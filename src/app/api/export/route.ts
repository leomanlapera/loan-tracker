import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { toCsv, type CsvValue } from '@/lib/csv'

type Row = Record<string, unknown>

function rowsToCsv(rows: Row[] | null | undefined): string {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const body: CsvValue[][] = rows.map((r) =>
    headers.map((h) => {
      const v = r[h]
      if (v === null || v === undefined) return null
      if (typeof v === 'object') return JSON.stringify(v)
      return v as CsvValue
    }),
  )
  return toCsv(headers, body)
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const [
    { data: profile },
    { data: borrowers },
    { data: loans },
    { data: schedule },
    { data: payments },
    { data: activity },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id),
    supabase.from('borrowers').select('*'),
    supabase.from('loans').select('*'),
    supabase.from('loan_custom_schedule').select('*'),
    supabase.from('payments').select('*'),
    supabase.from('activity_log').select('*'),
  ])

  const zip = new JSZip()
  const stamp = format(new Date(), 'yyyy-MM-dd')
  zip.file(`profile.csv`, rowsToCsv(profile as Row[]))
  zip.file(`borrowers.csv`, rowsToCsv(borrowers as Row[]))
  zip.file(`loans.csv`, rowsToCsv(loans as Row[]))
  zip.file(`loan_custom_schedule.csv`, rowsToCsv(schedule as Row[]))
  zip.file(`payments.csv`, rowsToCsv(payments as Row[]))
  zip.file(`activity_log.csv`, rowsToCsv(activity as Row[]))
  zip.file(
    'README.txt',
    [
      'Loan Tracker — data export',
      `Generated ${new Date().toISOString()}`,
      `User: ${user.email}`,
      '',
      'CSV files:',
      '  profile.csv                 — your profile row',
      '  borrowers.csv               — every borrower you own',
      '  loans.csv                   — every loan you own',
      '  loan_custom_schedule.csv    — custom repayment rows',
      '  payments.csv                — every payment logged (including soft-deleted)',
      '  activity_log.csv            — audit trail',
      '',
      'RA 10173 (Data Privacy Act) portability export.',
    ].join('\n'),
  )

  const blob = await zip.generateAsync({ type: 'nodebuffer' })
  return new NextResponse(new Uint8Array(blob), {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="loan-tracker-export_${stamp}.zip"`,
      'cache-control': 'no-store',
    },
  })
}
