# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 3 — Borrower & Loan CRUD: ✅ Complete**

See [`phases/README.md`](./phases/README.md) for the full plan.

## Phase progress

| # | Phase | Status |
|---|---|---|
| 0 | [Foundation & Setup](./phases/phase-00-foundation.md) | ✅ Complete |
| 1 | [Calculation Engine](./phases/phase-01-engine.md) | ✅ Complete |
| 2 | [Auth & Data Model](./phases/phase-02-auth-data.md) | ✅ Complete |
| 3 | [Borrower & Loan CRUD](./phases/phase-03-borrowers-loans.md) | ✅ Complete |
| 4 | [Payments & Loan Detail](./phases/phase-04-payments-detail.md) | ⏳ Next |
| 5 | [Dashboard & Reports](./phases/phase-05-dashboard-reports.md) | ⏳ Pending |
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ⏳ Pending |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Pending |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 3 highlights

**Borrowers**
- `/borrowers` — searchable table with per-borrower total outstanding and active loan count (both computed server-side via the engine)
- `/borrowers/new` — form (react-hook-form + Zod resolver)
- `/borrowers/[id]` — detail with inline edit form, archive/unarchive, delete (blocked with tooltip when active loans exist), list of the borrower's loans
- Server actions in `src/app/(app)/borrowers/actions.ts`: create, update, archive, delete (with active-loans guard)

**Loans**
- `/loans` — searchable table, borrower name, principal, rate, current balance (engine), next due, status; `Show closed` toggle
- `/loans/new` — full PRD §5.3 form with **live engine preview** on the right (updates as you type: schedule table, maturity date, total scheduled, total interest)
- `/loans/[id]/edit` — same form; principal, rate, start date, interest method **locked when payments exist** (hint text explains why)
- `/loans/[id]` — summary tiles (current balance, total paid, interest earned, next due). Full schedule + payments log land in Phase 4
- Custom repayment sub-form: dynamic rows matching tenureMonths; last period auto-adjusted by engine
- **§10 compliance**: mandatory "Interest terms are in a signed written agreement" checkbox; soft warning when monthly rate > 6%
- Server actions: create, update (deletes and re-inserts custom schedule), cancel (blocked if payments exist), writeOff, reopen

**Engine ↔ UI**
- Client-side engine preview matches server compute (same pure module runs in browser and RSC)
- Server-computed dashboard tiles: active loan count, principal lent, total outstanding, interest earned, overdue banner
- `src/lib/format.ts` — `formatPHP`, `formatDate`, `formatRate` (Intl.NumberFormat en-PH, `MMM d, yyyy`)
- `src/lib/engine/loan-summary.ts` — safe `summarize()` wrapper for list rows

**Infrastructure**
- Database types generated from remote → `src/lib/supabase/database.types.ts` (430 lines). All Supabase clients now typed via `Database` generic.
- New script: `pnpm db:types` — regenerate after schema changes.
- shadcn components added: select, checkbox, textarea, badge, dropdown-menu, alert-dialog, separator.
- Custom `Field` primitive in `src/components/form/field.tsx` (label + error slot).

**App shell**
- Nav bar with Dashboard / Borrowers / Loans links
- Dashboard shows real numbers: active loans, principal lent, total outstanding, interest earned, overdue banner when any loan is overdue

## What's shipped (Phases 0–3)

**Framework & tooling**
- Next.js 16 App Router + Turbopack + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui variant)
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `server-only`
- Dev: Vitest 3, jsdom 24, Playwright, Prettier, Supabase CLI (as workspace dep), `ws` for Node 20 realtime shim

**Engine** — `src/lib/engine/`, 30 passing tests, PRD §6.6 cases to the centavo

**Supabase**
- `client.ts` / `server.ts` / `middleware.ts` / `admin.ts` all typed via generated `Database`
- 7 migrations applied to remote project `skmwpbkrdsxlhlgsprmq`
- RLS enforced (17/17 integration tests pass), including the tightened payments policy (loan must belong to caller)

**Routes** (14 total)
- Public: `/`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update`, `/auth/callback`
- Authed: `/dashboard`, `/borrowers`, `/borrowers/new`, `/borrowers/[id]`, `/loans`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit`

## Verified

- ✅ `pnpm lint` (one non-blocking React Compiler hint about RHF's watch() — standard usage)
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (30/30)
- ✅ `pnpm build` — 14 routes, all dynamic (middleware attached)
- ✅ `pnpm test:integration` (17/17, run before Phase 3 code changes)

## Known deferred

- Full loan detail page (schedule table + chart + payment log) — Phase 4
- Payment logging Server Actions and forms — Phase 4
- shadcn `form` component slug still unresolved — replaced with the minimal `Field` wrapper
- Interest-only repayment type — Phase 8 backlog
- Vercel project not linked yet
- Late-payment penalty rate/fee (PRD §12 Q2) — still open, revisit in Phase 4 if it affects payment allocation

## Setup to-dos for the maintainer

Nothing new for Phase 3 if you already ran the Phase 2 setup (`supabase login` + `db:push`). If the schema ever drifts, regenerate types with:

```bash
pnpm db:types
```

Still pending from earlier phases:
- Supabase Dashboard → Auth → URL Configuration → Site URL: `http://localhost:3000`
- Vercel — `vercel link` and add env vars when you deploy

## CI

Not configured. Quality checks run locally via `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm e2e`. Re-add a GitHub Actions workflow when the account can host runners.

## Up next

**Phase 4 — Payments & Loan Detail Page.** Log payments (with soft delete + edit), enforce overpayment rejection, "pay off loan" shortcut, full schedule table with status chips (paid/partial/unpaid/upcoming), Recharts balance-over-time (compound vs simple), edit history for payments.
