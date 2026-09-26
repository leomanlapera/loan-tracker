# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 5 — Dashboard & Reports: ✅ Complete**

See [`phases/README.md`](./phases/README.md) for the full plan.

## Phase progress

| # | Phase | Status |
|---|---|---|
| 0 | [Foundation & Setup](./phases/phase-00-foundation.md) | ✅ Complete |
| 1 | [Calculation Engine](./phases/phase-01-engine.md) | ✅ Complete |
| 2 | [Auth & Data Model](./phases/phase-02-auth-data.md) | ✅ Complete |
| 3 | [Borrower & Loan CRUD](./phases/phase-03-borrowers-loans.md) | ✅ Complete |
| 4 | [Payments & Loan Detail](./phases/phase-04-payments-detail.md) | ✅ Complete |
| 5 | [Dashboard & Reports](./phases/phase-05-dashboard-reports.md) | ✅ Complete |
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ⏳ Next |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Pending |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 5 highlights

**Engine additions**
- `src/lib/engine/allocate.ts` — new `allocatePayments()` returns per-payment `{toInterest, toPrincipal, periodIndex}`. Within a period, earlier payments consume interest first.
- Vitest: 3 new cases (matches PRD Case 2 allocation to the centavo, reconciles totals with `compute().interestEarnedToDate`, respects payment order inside a period)

**CSV utility** — `src/lib/csv.ts`
- RFC 4180 escaping, ISO dates, numbers pass through unquoted, BOM prefix so Excel opens en-PH characters cleanly
- `csvResponse(filename, body)` for route handlers; 6 Vitest cases

**Dashboard** (`/dashboard`) — every PRD §5.6 tile + list
- Active loans, principal lent (active), total outstanding, overdue count + amount
- Interest earned this month / this year / all time
- Collections this month
- Due-in-next-7-days list (top 5, linked to loan pages)
- Recent payments list (top 5, borrower + date + method + amount)
- Overdue banner links to aging report

**Reports** — hub at `/reports` + 6 report pages + 6 CSV export routes
- Portfolio summary — per-loan snapshot at "as of" end date with balance, total paid, interest earned
- Borrower statement — pick a borrower, get full schedule per loan + payment history in range
- Collections — payments received in range, grouped by day/week/month toggle AND by method, with per-column and per-row totals
- Interest income — per-month interest portion of payments received, via the new allocation helper
- Aging — 1-30 / 31-60 / 61-90 / 90+ bucketing on the oldest days-past-due per loan
- Write-offs — loans with status `written_off` in range, showing loss (balance at write-off)

**Report infrastructure**
- `src/lib/reports/loans.ts` — `loadAllLoans()` bundles loans + borrower names + payments + custom schedules in 4 queries. `summarizeAt(loan, asOf)` and `activePayments(loan, cutoff)` helpers reused across every report.
- `src/lib/reports/date-range.ts` — safe `parseDateRange()` from search params with fallbacks
- `src/lib/reports/{collections,interest,aging}.ts` — shared bucketing logic (page + CSV both call the same function so numbers match)
- `DateRangeForm` client component — uncontrolled inputs, key on `${from}-${to}` so revalidation resets cleanly

**Nav** — Reports link added to the app-shell nav.

## What's shipped (Phases 0–5)

**Framework & tooling**
- Next.js 16 App Router + Turbopack + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui variant)
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `server-only`
- Dev: Vitest 3, jsdom 24, Playwright, Prettier, Supabase CLI (workspace dep), `ws` for Node 20 realtime shim

**Engine** — 39 Vitest cases (30 core + 3 allocation + 6 CSV)

**Supabase** — 7 migrations applied, RLS enforced (17/17 integration tests), tightened payments policy, generated database types

**Routes** (26 total, all dynamic)
- Public: `/`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update`, `/auth/callback`
- Authed pages: `/dashboard`, `/borrowers`, `/borrowers/new`, `/borrowers/[id]`, `/loans`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit`, `/reports`, `/reports/{portfolio,statement,collections,interest,aging,write-offs}`
- CSV route handlers: `/reports/{portfolio,statement,collections,interest,aging,write-offs}/export`

## Verified

- ✅ `pnpm lint` (2 non-blocking React Compiler notes on RHF `watch()` — standard usage)
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (39/39)
- ✅ `pnpm build` — 26 routes, all dynamic

## Known deferred

- Activity log triggers, settings page, data export — Phase 6
- Interest-only repayment type — Phase 8 backlog
- Late-payment penalty rate/fee (PRD §12 Q2) — still open
- Vercel project not linked yet

## Setup to-dos for the maintainer

Nothing new for Phase 5. Still pending from earlier phases:
- Supabase Dashboard → Auth → URL Configuration → Site URL: `http://localhost:3000` (dev) and eventual production URL
- Vercel — `vercel link` and env vars when you deploy

## CI

Not configured. Quality checks run locally via `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm e2e`. Re-add a GitHub Actions workflow when the account can host runners.

## Up next

**Phase 6 — Activity Log & Settings.** Postgres triggers write to `activity_log` on every borrower/loan/payment change (SECURITY DEFINER for RLS). Read-only `/activity` page with entity + date filters. Settings page for display name, default grace period, default interest method, default repayment type. RA 10173 data export (ZIP of CSVs).
