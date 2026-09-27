/**
 * Seed realistic demo data for a single user.
 *
 * Usage:
 *   pnpm db:seed --user you@example.com          # append 100 borrowers + 100 loans
 *   pnpm db:seed --user you@example.com --reset  # WIPE this user's borrowers/loans/payments first
 *   pnpm db:seed --user you@example.com --seed 42
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (loaded via --env-file=.env.local).
 * Runs against whichever project those env vars point at — including your remote dev project.
 * The service-role client bypasses RLS.
 */
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { addDays, addMonths, format, subMonths } from 'date-fns'
import type { Database } from '../src/lib/supabase/database.types'

type LoanStatus = Database['public']['Enums']['loan_status']
type InterestMethod = Database['public']['Enums']['interest_method']
type RepaymentType = Database['public']['Enums']['repayment_type']
type PaymentMethod = Database['public']['Enums']['payment_method']

// --- Filipino names + surnames for realism ---------------------------------

const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Luz', 'Ramon', 'Rosa', 'Carlo', 'Jenny',
  'Mark', 'Grace', 'Miguel', 'Bea', 'Nico', 'Leah', 'Diego', 'Cielo', 'Rafael', 'Mia',
  'Emilio', 'Sofia', 'Andres', 'Isabel', 'Manuel', 'Cristina', 'Ricardo', 'Elena', 'Antonio', 'Teresa',
  'Francisco', 'Corazon', 'Roberto', 'Angelica', 'Eduardo', 'Vivian', 'Gerardo', 'Nadine', 'Rene', 'Lea',
  'Paolo', 'Karla', 'Alfredo', 'Marisa', 'Enrique', 'Yolanda', 'Ignacio', 'Marielle', 'Cesar', 'Divine',
  'Fernando', 'Rachelle', 'Danilo', 'Precious', 'Rolando', 'Jasmin', 'Nestor', 'Sharon', 'Arturo', 'Camille',
] as const

const SURNAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Villanueva', 'Dela Cruz', 'Gonzales',
  'Mendoza', 'Aguilar', 'Pascual', 'De Leon', 'Ramos', 'Domingo', 'Fernandez', 'Rivera',
  'Torres', 'Flores', 'Aquino', 'Navarro', 'Castillo', 'Manalo', 'Garcia', 'Salazar',
  'Tolentino', 'Marquez', 'Enriquez', 'Alvarez', 'Del Rosario', 'Diaz', 'Andrade', 'Yap',
  'Ilagan', 'Ferrer', 'Balagtas', 'Padilla', 'Legaspi', 'Silva', 'Roque', 'Perez',
] as const

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'gcash', 'maya']

// --- Seeded PRNG (mulberry32) so runs are reproducible per --seed ----------

function makeRng(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- Args ------------------------------------------------------------------

interface Args {
  user: string
  reset: boolean
  seed: number
  borrowers: number
  loans: number
}

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  const out: Args = { user: '', reset: false, seed: 42, borrowers: 100, loans: 100 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--user') out.user = argv[++i] ?? ''
    else if (a === '--reset') out.reset = true
    else if (a === '--seed') out.seed = Number(argv[++i])
    else if (a === '--borrowers') out.borrowers = Number(argv[++i])
    else if (a === '--loans') out.loans = Number(argv[++i])
    else if (a === '--help' || a === '-h') {
      console.log(HELP)
      process.exit(0)
    } else {
      console.error(`Unknown arg: ${a}\n${HELP}`)
      process.exit(1)
    }
  }
  if (!out.user) {
    console.error(`Missing --user <email>.\n${HELP}`)
    process.exit(1)
  }
  return out
}

const HELP = `Usage: pnpm db:seed --user <email> [--reset] [--seed N] [--borrowers N] [--loans N]

  --user      Target user (must already exist in Supabase Auth). Data attaches to this user_id.
  --reset     Delete this user's existing borrowers/loans/payments first.
  --seed      PRNG seed for reproducibility (default 42).
  --borrowers Count of borrowers to create (default 100).
  --loans     Count of loans to create (default 100).
`

// --- Helpers ---------------------------------------------------------------

function pick<T>(rng: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]
}

function chance(rng: () => number, p: number): boolean {
  return rng() < p
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

function phone(rng: () => number): string {
  let s = '09'
  for (let i = 0; i < 9; i++) s += String(randInt(rng, 0, 9))
  return s
}

function emailFor(first: string, last: string, i: number): string {
  const slug = `${first}.${last}`.toLowerCase().replace(/\s+/g, '.')
  return `${slug}${i}@example.com`
}

// Rough amortised monthly payment for a compound-interest loan (for realistic
// payment sizing). If tenure is 0 or rate 0, falls back to principal/tenure.
function monthlyPayment(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) return principal
  if (monthlyRate === 0) return principal / months
  const r = monthlyRate
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

// --- Main ------------------------------------------------------------------

async function main() {
  const args = parseArgs()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load from .env.local — the pnpm script does this via --env-file.',
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node 20 has no global WebSocket; realtime-js constructs one on init.
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  })

  // Resolve user id from email via the auth admin API.
  console.log(`Looking up user ${args.user}…`)
  const { data: usersList, error: userErr } = await supabase.auth.admin.listUsers({
    perPage: 200,
  })
  if (userErr) throw userErr
  const user = usersList.users.find((u) => u.email?.toLowerCase() === args.user.toLowerCase())
  if (!user) {
    console.error(
      `No user with email ${args.user}. Invite them first via Supabase Dashboard → Auth → Users.`,
    )
    process.exit(1)
  }
  console.log(`✓ user_id=${user.id}`)

  if (args.reset) {
    console.log('Resetting existing data for this user…')
    // Order matters: payments/custom-schedule -> loans -> borrowers.
    // Rows are RLS-restricted by user_id; service-role bypasses RLS anyway.
    await supabase.from('payments').delete().eq('user_id', user.id)
    const { data: loanIds } = await supabase.from('loans').select('id').eq('user_id', user.id)
    if (loanIds?.length) {
      await supabase
        .from('loan_custom_schedule')
        .delete()
        .in(
          'loan_id',
          loanIds.map((r) => r.id),
        )
    }
    await supabase.from('loans').delete().eq('user_id', user.id)
    await supabase.from('borrowers').delete().eq('user_id', user.id)
    console.log('✓ wiped borrowers/loans/payments')
  }

  const rng = makeRng(args.seed)
  const today = new Date()

  // --- Borrowers ------------------------------------------------------------
  console.log(`Creating ${args.borrowers} borrowers…`)
  const borrowerRows: Database['public']['Tables']['borrowers']['Insert'][] = []
  for (let i = 0; i < args.borrowers; i++) {
    const first = pick(rng, FIRST_NAMES)
    const last = pick(rng, SURNAMES)
    const hasEmail = chance(rng, 0.7)
    const hasMobile = chance(rng, 0.9)
    borrowerRows.push({
      user_id: user.id,
      full_name: `${first} ${last}`,
      mobile: hasMobile ? phone(rng) : null,
      email: hasEmail ? emailFor(first, last, i) : null,
      address: chance(rng, 0.5) ? `${randInt(rng, 1, 999)} Rizal St, Quezon City` : null,
      notes: chance(rng, 0.15) ? 'Referred by long-time client.' : null,
      archived_at: chance(rng, 0.05) ? subMonths(today, randInt(rng, 1, 12)).toISOString() : null,
    })
  }
  const { data: insertedBorrowers, error: bErr } = await supabase
    .from('borrowers')
    .insert(borrowerRows)
    .select('id')
  if (bErr) throw bErr
  const borrowerIds = insertedBorrowers!.map((b) => b.id)
  console.log(`✓ ${borrowerIds.length} borrowers`)

  // --- Loans ---------------------------------------------------------------
  console.log(`Creating ${args.loans} loans…`)
  const loanRows: Database['public']['Tables']['loans']['Insert'][] = []

  // Distribute loans across borrowers with a rough Pareto-ish bias so a few
  // borrowers have multiple loans and some have none.
  const loansPerBorrower: number[] = new Array(borrowerIds.length).fill(0)
  for (let i = 0; i < args.loans; i++) {
    // Weight earlier borrowers slightly higher for a natural spread.
    const idx = Math.min(
      borrowerIds.length - 1,
      Math.floor(borrowerIds.length * Math.pow(rng(), 1.7)),
    )
    loansPerBorrower[idx]++
  }

  const RATES = [0.02, 0.025, 0.03, 0.035, 0.04, 0.05, 0.06, 0.08]
  const TENURES = [3, 6, 9, 12, 18, 24]
  const INTEREST_METHODS: InterestMethod[] = ['compound', 'simple']
  const REPAYMENT_TYPES: RepaymentType[] = ['equal_installments', 'lump_sum']

  const loanContexts: {
    borrowerIdx: number
    principal: number
    rate: number
    tenure: number
    startDate: Date
    status: LoanStatus
    repayment: RepaymentType
    interest: InterestMethod
  }[] = []

  for (let bi = 0; bi < borrowerIds.length; bi++) {
    for (let k = 0; k < loansPerBorrower[bi]; k++) {
      // Skew principal low-to-mid: 5k–50k common, up to 500k rare.
      const roll = rng()
      const principal =
        roll < 0.5
          ? randInt(rng, 5_000, 50_000)
          : roll < 0.85
            ? randInt(rng, 50_000, 200_000)
            : randInt(rng, 200_000, 500_000)
      const rate = pick(rng, RATES)
      const tenure = pick(rng, TENURES)
      const startDate = subMonths(today, randInt(rng, 0, 24))
      const statusRoll = rng()
      const status: LoanStatus =
        statusRoll < 0.68
          ? 'active'
          : statusRoll < 0.88
            ? 'paid'
            : statusRoll < 0.94
              ? 'written_off'
              : 'cancelled'
      const repayment = pick(rng, REPAYMENT_TYPES)
      const interest = pick(rng, INTEREST_METHODS)

      loanRows.push({
        user_id: user.id,
        borrower_id: borrowerIds[bi],
        principal,
        monthly_rate: rate,
        tenure_months: tenure,
        start_date: format(startDate, 'yyyy-MM-dd'),
        interest_method: interest,
        repayment_type: repayment,
        after_maturity: chance(rng, 0.75) ? 'continue_accruing' : 'stop_accruing',
        grace_days: chance(rng, 0.3) ? 3 : 0,
        status,
        closed_at:
          status === 'paid' || status === 'cancelled' || status === 'written_off'
            ? addMonths(startDate, randInt(rng, 1, tenure)).toISOString()
            : null,
        agreement_in_writing: chance(rng, 0.6),
        notes: chance(rng, 0.1) ? 'Renewed from prior loan.' : null,
      })
      loanContexts.push({
        borrowerIdx: bi,
        principal,
        rate,
        tenure,
        startDate,
        status,
        repayment,
        interest,
      })
    }
  }

  const { data: insertedLoans, error: lErr } = await supabase
    .from('loans')
    .insert(loanRows)
    .select('id')
  if (lErr) throw lErr
  const loanIds = insertedLoans!.map((l) => l.id)
  console.log(`✓ ${loanIds.length} loans`)

  // --- Payments -----------------------------------------------------------
  console.log('Creating payments…')
  const paymentRows: Database['public']['Tables']['payments']['Insert'][] = []
  for (let li = 0; li < loanIds.length; li++) {
    const ctx = loanContexts[li]
    const loanId = loanIds[li]
    const monthsElapsed = Math.max(
      0,
      Math.floor((today.getTime() - ctx.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    )

    if (ctx.status === 'cancelled') continue

    const scheduledMonthly = monthlyPayment(ctx.principal, ctx.rate, ctx.tenure)

    // Decide how many payments to record.
    let paymentsToMake: number
    if (ctx.status === 'paid') {
      paymentsToMake = ctx.tenure
    } else if (ctx.status === 'written_off') {
      paymentsToMake = Math.min(ctx.tenure, Math.max(0, Math.floor(monthsElapsed * 0.4)))
    } else {
      // active: 30–110% of expected (some behind, some ahead, capped by tenure)
      const cap = Math.min(ctx.tenure, monthsElapsed + 1)
      const factor = 0.3 + rng() * 0.8
      paymentsToMake = Math.max(0, Math.min(cap, Math.round(cap * factor)))
    }

    for (let p = 0; p < paymentsToMake; p++) {
      const dueDate = addMonths(ctx.startDate, p + 1)
      // Payments trickle in a few days before/after due date.
      const paidOn = addDays(dueDate, randInt(rng, -3, 8))
      if (paidOn > today) continue
      // Amount: mostly on-schedule, sometimes slightly under/over.
      const wobble = 0.9 + rng() * 0.25
      let amount = Math.round(
        (ctx.repayment === 'lump_sum' && p < paymentsToMake - 1
          ? scheduledMonthly * 0.5
          : scheduledMonthly) * wobble,
      )
      // Guard against runaway 0 amounts.
      if (amount <= 0) amount = Math.round(scheduledMonthly)
      paymentRows.push({
        user_id: user.id,
        loan_id: loanId,
        amount,
        paid_on: format(paidOn, 'yyyy-MM-dd'),
        method: pick(rng, PAYMENT_METHODS),
        reference_no: chance(rng, 0.4) ? `REF-${randInt(rng, 100000, 999999)}` : null,
        note: chance(rng, 0.08) ? 'Partial — will settle balance next week.' : null,
      })
    }
  }

  // Insert payments in chunks of 500 (Supabase-safe).
  for (let i = 0; i < paymentRows.length; i += 500) {
    const slice = paymentRows.slice(i, i + 500)
    const { error: pErr } = await supabase.from('payments').insert(slice)
    if (pErr) throw pErr
  }
  console.log(`✓ ${paymentRows.length} payments`)

  console.log('\nDone. Open /dashboard to see the results.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
