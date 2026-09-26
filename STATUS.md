# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 4 — Payments & Loan Detail: ✅ Complete**

See [`phases/README.md`](./phases/README.md) for the full plan.

## Phase progress

| # | Phase | Status |
|---|---|---|
| 0 | [Foundation & Setup](./phases/phase-00-foundation.md) | ✅ Complete |
| 1 | [Calculation Engine](./phases/phase-01-engine.md) | ✅ Complete |
| 2 | [Auth & Data Model](./phases/phase-02-auth-data.md) | ✅ Complete |
| 3 | [Borrower & Loan CRUD](./phases/phase-03-borrowers-loans.md) | ✅ Complete |
| 4 | [Payments & Loan Detail](./phases/phase-04-payments-detail.md) | ✅ Complete |
| 5 | [Dashboard & Reports](./phases/phase-05-dashboard-reports.md) | ⏳ Next |
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ⏳ Pending |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Pending |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 4 highlights

**Payment logging**
- `src/lib/validation/payment.ts` — Zod schema for amount (>0, 2dp), paid_on (not future), method enum, reference, note
- `src/app/(app)/loans/payment-actions.ts` — Server Actions
  - `createPayment` — engine-based **overpayment rejection** with exact payoff in the error
  - `updatePayment` — same guard, excludes the row being edited
  - `softDeletePayment` / `restorePayment` — flip `deleted_at`, recompute balance, sync loan status
  - `computePayoff` — used by the "Pay off" shortcut button
  - `recomputeAndSyncStatus` runs after every mutation → sets `loans.status = paid` when balance hits ₱0.00, back to `active` on restore
- Payment dialog (`payment-dialog.tsx`) — reused for both new and edit
  - **"Pay off" button** fills the exact engine payoff for the selected date
  - Field-level errors from Zod, form-level error banner for engine rejections

**Loan detail page** (`/loans/[id]`)
- Summary tiles: current balance, total paid, interest earned, next due (or payoff amount when no next due)
- **Full schedule table** with per-period status chips: `paid` / `partial` / `unpaid` / `upcoming`, plus overdue badge
- Payment log with inline edit + soft delete + restore, `Show deleted` toggle to reveal history
- **Recharts balance-over-time chart** — compound vs simple curves computed from the same payment set (solid = this loan's method, dashed = the other for comparison)
- Action bar: Log payment · Pay off · Edit · Write off · Cancel (blocked when payments exist; use write off instead) · Reopen for non-paid closed loans

**Engine reuse**
- Both server-side compute (page load, action validation) and client-side chart projections share `src/lib/engine/`. Zero divergence.
- Preview on `/loans/new` (Phase 3), server summary on `/dashboard` and `/loans`, and the new schedule + chart all read the same schedule structure.

## What's shipped (Phases 0–4)

**Framework & tooling**
- Next.js 16 App Router + Turbopack + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui variant)
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `server-only`
- Dev: Vitest 3, jsdom 24, Playwright, Prettier, Supabase CLI (workspace dep), `ws` for Node 20 realtime shim

**Engine** — 30 Vitest cases (PRD §6.6 to the centavo) + payoff, overdue, partial re-amortization, custom schedule, after-maturity behaviors

**Supabase** — 7 migrations applied, RLS enforced (17/17 integration tests), tightened payments policy, generated database types

**Routes** (14 total, mostly server components)
- Public: `/`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update`, `/auth/callback`
- Authed: `/dashboard`, `/borrowers`, `/borrowers/new`, `/borrowers/[id]`, `/loans`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit`

## Verified

- ✅ `pnpm lint` (React Compiler notes on RHF `watch()` — standard, non-blocking)
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (30/30)
- ✅ `pnpm build` — 14 routes, all dynamic (middleware attached)

## Known deferred

- Reports (portfolio, borrower statement, collections, interest income, aging, write-offs) — Phase 5
- Activity log triggers + settings page + data export — Phase 6
- Interest-only repayment type — Phase 8 backlog
- Late-payment penalty rate/fee (PRD §12 Q2) — still open
- Vercel project not linked yet

## Setup to-dos for the maintainer

None new for Phase 4 (no schema changes). Still pending from earlier phases:
- Supabase Dashboard → Auth → URL Configuration → Site URL: `http://localhost:3000` (dev) and eventual production URL
- Vercel — `vercel link` and env vars when you deploy

## CI

Not configured. Quality checks run locally via `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm e2e`. Re-add a GitHub Actions workflow when the account can host runners.

## Up next

**Phase 5 — Dashboard & Reports.** Real dashboard tiles (this month collections, this year interest, next-7-days due list, recent payments) + all six PRD §5.7 reports with date filters and CSV export.
