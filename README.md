# Loan Tracker

A web app for private lenders in the Philippines to record loans, log payments, and see what borrowers owe. Supports monthly compounding or simple interest, lump-sum or installment repayment, with a dashboard and six reports on collections, interest earned, and overdue accounts.

See [`loan_tracker_prd.md`](./loan_tracker_prd.md) for the full product spec, [`phases/`](./phases) for the delivery plan, and [`STATUS.md`](./STATUS.md) for the current build state.

## Stack

- **Next.js 16** — App Router, TypeScript, Server Actions, Turbopack
- **Supabase** — Auth + Postgres with Row Level Security; typed via generated `Database`
- **decimal.js** — money math (never JS floats)
- **Zod** — schema validation shared between forms and Server Actions
- **Tailwind v4 + shadcn/ui** (base-ui variant)
- **Recharts** — balance-over-time chart on the loan detail page
- **Vitest + Playwright** — engine unit tests, RLS integration tests, e2e smoke
- **Vercel** — hosting

## Prerequisites

- Node **20** (see `.nvmrc`)
- **pnpm 10** (`corepack enable && corepack prepare pnpm@10 --activate`)
- A Supabase project (create at [supabase.com](https://supabase.com))

The Supabase CLI is bundled as a workspace dev dep — no separate install.

## Setup

```bash
pnpm install
cp .env.example .env.local
# fill in Supabase URL and keys from your project's API settings
pnpm dev
```

App runs at http://localhost:3000.

### First-time Supabase setup

Once `.env.local` is filled in, wire the repo to your Supabase project:

```bash
pnpm exec supabase login                                   # interactive, opens a browser
pnpm exec supabase link --project-ref YOUR-PROJECT-REF     # ref lives in supabase/config.toml
pnpm db:push                                               # applies all migrations to the remote
pnpm db:types                                              # regenerate database.types.ts after any schema change
```

In the Supabase Dashboard → Auth → URL Configuration, set **Site URL** to `http://localhost:3000` (and any deployed URLs) so email confirmation links resolve.

Verify RLS is enforced with the integration suite:

```bash
pnpm test:integration
```

## Features (MVP through Phase 5)

- **Auth** — email + password with confirmation, password reset, account deletion (RA 10173)
- **Borrowers** — CRUD, search, archive, delete-guarded when active loans exist
- **Loans** — CRUD with live engine preview, edit-gating when payments exist, custom repayment schedules, §10 written-agreement checkbox
- **Payments** — log/edit/soft-delete/restore with engine-based overpayment rejection and "pay off" shortcut
- **Loan detail page** — summary tiles, full schedule with status chips, payment log, compound-vs-simple chart
- **Dashboard** — every PRD §5.6 tile: outstanding, interest earned (this month / this year / all time), collections this month, overdue, due-in-7, recent payments
- **Reports** (all with date filters and CSV export)
  - Portfolio summary
  - Borrower statement
  - Collections (day/week/month × method)
  - Interest income (per-month interest portion of payments)
  - Aging (1-30 / 31-60 / 61-90 / 90+)
  - Write-offs

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (engine + CSV util) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:integration` | Two-user RLS tests against the linked Supabase project |
| `pnpm e2e` | Playwright end-to-end tests |
| `pnpm format` | Prettier write |
| `pnpm db:diff` | Generate a migration from local schema changes |
| `pnpm db:reset` | Rebuild the DB from migrations (local or `--linked` for remote) |
| `pnpm db:push` | Push migrations to the linked remote project |
| `pnpm db:types` | Regenerate `src/lib/supabase/database.types.ts` from the linked project |

Anything else the CLI exposes is reachable via `pnpm exec supabase ...`.

## Project layout

```
src/
  app/
    (app)/                 # authenticated routes
      dashboard/           # PRD §5.6 tiles + lists
      borrowers/           # list, new, [id] with inline edit/archive/delete
      loans/               # list, new, [id] detail + payments + chart, [id]/edit
      reports/             # 6 reports + CSV export route handlers
    (auth)/                # login, sign-up, reset-password
    auth/callback/         # email-link handler
  components/
    auth/                  # auth-form pieces
    form/                  # Field wrapper
    reports/               # DateRangeForm
    ui/                    # shadcn/ui primitives
  lib/
    engine/                # pure TS calculation engine (see PRD §6)
      compute.ts           # main walk (schedule + summary)
      allocate.ts          # per-payment {toInterest, toPrincipal}
      pmt.ts / money.ts / period.ts / validate.ts / types.ts
    reports/               # loans, date-range, collections, interest, aging
    supabase/              # client, server, middleware, admin, database.types
    validation/            # Zod schemas (auth, borrower, loan, payment)
    csv.ts                 # RFC 4180 CSV + Response helper
    format.ts              # en-PH currency, dates, rate formatting
integration/               # RLS test suite (test:integration)
supabase/
  migrations/              # SQL migrations, committed and pushed via db:push
  config.toml              # links to the remote project
tests/                     # Playwright specs
phases/                    # delivery plan
```

## Environment variables

See `.env.example`. Never commit `.env.local`. The service role key must stay server-side only — the `server-only` import in `src/lib/supabase/admin.ts` will hard-fail any bundle that leaks it to the browser.

## Contributing

- Every schema change ships as a Supabase migration in `supabase/migrations/`.
- Every user-owned table needs RLS + `integration/rls.test.ts` coverage before the phase closes.
- Engine changes require a Vitest case; PRD §6.6 cases are the source of truth for correctness.
- Money math is `decimal.js`, always. Never `Number` for anything that ends up on a lender's screen.
