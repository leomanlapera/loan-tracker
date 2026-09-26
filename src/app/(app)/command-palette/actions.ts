'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface PaletteEntry {
  kind: 'borrower' | 'loan'
  id: string
  href: string
  label: string
  hint?: string
}

/**
 * Compact borrower + loan directory for the Cmd+K palette. Keeps payloads
 * small — no engine compute, just names and IDs.
 */
export async function listPaletteEntries(): Promise<PaletteEntry[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: borrowers = [] }, { data: loans = [] }] = await Promise.all([
    supabase.from('borrowers').select('id, full_name, archived_at').order('full_name'),
    supabase
      .from('loans')
      .select('id, borrower_id, principal, monthly_rate, status, start_date')
      .order('start_date', { ascending: false }),
  ])

  const nameById = new Map(
    (borrowers ?? []).map((b) => [
      b.id,
      { name: b.full_name, archived: !!b.archived_at },
    ]),
  )

  const entries: PaletteEntry[] = []

  for (const b of borrowers ?? []) {
    entries.push({
      kind: 'borrower',
      id: b.id,
      href: `/borrowers/${b.id}`,
      label: b.full_name,
      hint: b.archived_at ? 'Archived' : 'Borrower',
    })
  }

  for (const l of loans ?? []) {
    const owner = nameById.get(l.borrower_id)
    if (!owner) continue
    entries.push({
      kind: 'loan',
      id: l.id,
      href: `/loans/${l.id}`,
      label: `${owner.name}`,
      hint: `Loan · ${Number(l.principal).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })} @ ${Number(l.monthly_rate)}%/mo · ${l.status}`,
    })
  }

  return entries
}
