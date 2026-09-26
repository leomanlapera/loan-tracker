# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 6 — Activity Log & Settings: ✅ Complete**

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
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ✅ Complete |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Next |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 6 highlights

**Activity log triggers** — `supabase/migrations/20260926110000_activity_log_triggers.sql`
- One `SECURITY DEFINER` trigger fn per user-owned table: `log_borrower_activity`, `log_loan_activity`, `log_payment_activity`, `log_loan_custom_schedule_activity`
- `activity_log` still has NO write policies for regular users — only these triggers may insert
- Acting user resolved via `auth.uid()`, with `NEW.user_id` / `OLD.user_id` fallback for service-role writes (seeding, etc.)
- `loan_custom_schedule` joins `loans` to resolve ownership
- UPDATE trigger short-circuits if `to_jsonb(new) = to_jsonb(old)` — no phantom rows from no-op updates

**Activity log page** — `/activity`
- Server component with `ActivityFilterBar` client component for filters
- Filters: date range, entity type, action
- Rows show timestamp, entity, action, id prefix; expandable to a field-level before/after diff for updates or full JSON for create/delete
- Capped at 200 rows (labeled when the cap is hit)

**Settings page** — `/settings`
- Profile card: display name, default grace days, default interest method, default repayment type (react-hook-form + Zod)
- Region card: currency/timezone read-only (PHP · Asia/Manila) per PRD MVP
- Data export card: single link to `/api/export` — ZIP of CSVs
- Danger zone: account deletion inside an AlertDialog

**Defaults applied to new loans** — `/loans/new` fetches the caller's profile and pre-fills `graceDays`, `interestMethod`, `repaymentType` from it. Existing loans keep their originals.

**Data export** — `/api/export` (route handler)
- Bundles `profile`, `borrowers`, `loans`, `loan_custom_schedule`, `payments`, `activity_log` as CSVs into a ZIP via `jszip`
- README.txt in the ZIP explains contents and cites RA 10173 portability
- Only the caller's rows (RLS enforced on every table)

**Integration tests** — `integration/rls.test.ts` extended to 19 cases (was 17)
- Assert the trigger records create/update/delete for user A
- Confirm user B still sees zero activity log rows

**App shell** — nav now includes `Activity` and `Settings` links.

## What's shipped (Phases 0–6)

**Framework & tooling**
- Next.js 16 App Router + Turbopack + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui variant, Wealthy Greens palette, IBM Plex Sans/Mono)
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `jszip`
- Dev: Vitest 3, jsdom 24, Playwright, Prettier, Supabase CLI (workspace dep), `ws` for Node 20 realtime shim

**Engine** — 39 Vitest cases (30 core + 3 allocation + 6 CSV)

**Supabase** — 8 migrations applied to remote, RLS enforced (19/19 integration tests), tightened payments policy, activity-log triggers writing on every mutation

**Routes** (29 total, all dynamic)
- Public: `/`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update`, `/auth/callback`
- Authed pages: `/dashboard`, `/borrowers`, `/borrowers/new`, `/borrowers/[id]`, `/loans`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit`, `/reports`, `/reports/{portfolio,statement,collections,interest,aging,write-offs}`, `/activity`, `/settings`
- CSV route handlers: `/reports/{portfolio,statement,collections,interest,aging,write-offs}/export`
- Data export: `/api/export`

## Verified

- ✅ `pnpm lint` (3 non-blocking React Compiler notes on RHF `watch()`)
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (39/39)
- ✅ `pnpm build` — 29 routes
- ✅ `pnpm test:integration` (19/19, including trigger assertions)

## Known deferred

- Interest-only repayment type — Phase 8 backlog
- Late-payment penalty rate/fee (PRD §12 Q2) — Phase 8 backlog
- Vercel project not linked yet
- Full Playwright two-user e2e — Phase 7

## Setup to-dos for the maintainer

Nothing new for Phase 6. Migrations were pushed and types regenerated as part of this phase. Still pending:
- Supabase Dashboard → Auth → URL Configuration → Site URL: `http://localhost:3000` (dev) and eventual production URL
- Vercel — `vercel link` and env vars when you deploy

## CI

Not configured. Quality checks run locally via `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm e2e`. Re-add a GitHub Actions workflow when the account can host runners.

## Up next

**Phase 7 — Polish, QA & Launch.** WCAG 2.2 AA audit, Lighthouse + Axe in Playwright, security regression pass, legal review, backups + runbook, beta with 3–5 real lenders.
