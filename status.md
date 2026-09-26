# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 1 — Calculation Engine: ✅ Complete**

See [`phases/README.md`](./phases/README.md) for the full plan.

## Phase progress

| # | Phase | Status |
|---|---|---|
| 0 | [Foundation & Setup](./phases/phase-00-foundation.md) | ✅ Complete |
| 1 | [Calculation Engine](./phases/phase-01-engine.md) | ✅ Complete |
| 2 | [Auth & Data Model](./phases/phase-02-auth-data.md) | ⏳ Next |
| 3 | [Borrower & Loan CRUD](./phases/phase-03-borrowers-loans.md) | ⏳ Pending |
| 4 | [Payments & Loan Detail](./phases/phase-04-payments-detail.md) | ⏳ Pending |
| 5 | [Dashboard & Reports](./phases/phase-05-dashboard-reports.md) | ⏳ Pending |
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ⏳ Pending |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Pending |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 1 highlights

**Engine** — `src/lib/engine/`
- `types.ts` — `LoanInput`, `PaymentInput`, `EngineInput`, `EngineOutput`, `PeriodRow`, all enums
- `money.ts` — `decimal.js` config (precision 40, half-up); `money()` rounds to 2 decimals
- `period.ts` — `dueDateOf` (end-of-month clamp via `date-fns` `addMonths`), payment→period bucketing, overdue check
- `pmt.ts` — annuity formula with zero-rate fallback
- `validate.ts` — throws `EngineInputError` on invalid inputs at the boundary
- `compute.ts` — main walk producing schedule + summary; `validatePayment()` for overpayment rejection

**Behavior decided this phase**
- Partial/missed installments **re-amortize** the remaining periods, but the running installment is only recomputed when a payment deviates from schedule (matches PRD §6.6 Case 2 where PMT stays ₱3,672.09 across periods).
- **Interest-only** repayment type deferred to Phase 2.
- Engine **throws on invalid inputs** (principal ≤ 0, negative rate/amount, tenure out of range, future paidOn, malformed custom schedule).

**Tests** — 30 passing (`src/lib/engine/index.test.ts`)
- PRD §6.6 Case 1 — lump sum, compound (₱11,576.25) + simple (₱11,500.00) at maturity
- PRD §6.6 Case 2 — equal installments, all 3 periods to the centavo, total = ₱11,016.26
- PRD §6.6 Case 3 — missed payment, compound lump sum, period 2 opening = ₱10,500.00
- PMT formula (zero rate, standard, n≤0)
- Period math (Jan 31 → Feb 28 clamp; Jan 31 → Mar 31 restore)
- Zero-rate equal installments
- Partial payment re-amortization
- Overpayment rejection + exact-payoff acceptance
- `continue_accruing` vs `stop_accruing` after maturity
- Overdue flag with grace period
- Input validation (7 cases)
- Custom repayment last-period auto-adjust
- Mid-period payoff includes full-month interest
- Simple interest — unpaid does not compound

## What's shipped (Phases 0–1)

**Framework & tooling**
- Next.js 16 (App Router, Turbopack, TypeScript, `src/` layout)
- Tailwind CSS v4 + shadcn/ui (button, input, card, table, dialog, label)
- Runtime deps: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`
- Dev deps: Vitest 3 + `@vitejs/plugin-react`, jsdom 24, Playwright, Prettier + tailwind plugin

**Supabase**
- `src/lib/supabase/{client,server,middleware}.ts` using `@supabase/ssr`
- Root `middleware.ts` — session refresh + redirect to `/login` for protected routes
- `supabase/config.toml` linked to remote project ref `skmwpbkrdsxlhlgsprmq`
- `supabase/migrations/` folder ready for Phase 2 schema

**CI/CD**
- `.github/workflows/ci.yml`
  - `quality` job: lint → typecheck → vitest
  - `e2e` job: Playwright Chromium with report artifact on failure
  - Env vars read from GitHub Actions secrets (with dummy fallbacks)

**Config**
- `.nvmrc` → Node 20
- `.prettierrc` + `.prettierignore`
- `.env.example` template; `.env.local` gitignored
- `tsconfig.json` excludes `tests/`, `playwright-report/`, `.next/`
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `e2e`, `format`, `format:check`, `db:diff`, `db:reset`, `db:push`

## Verified

- ✅ `pnpm lint`
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (30/30)
- ✅ `pnpm build`
- ✅ `pnpm dev` serves the landing page with real Supabase env vars

## Known deferred

- shadcn `form` component slug not resolving from the current registry — add manually when the first form ships in Phase 3 (deps `react-hook-form` + `@hookform/resolvers` already installed).
- Supabase CLI not installed globally; needed for `pnpm db:*` scripts (`brew install supabase/tap/supabase` or `pnpm dlx supabase`).
- Vercel project not linked yet.
- Interest-only repayment type — Phase 2 backlog.

## Setup to-dos for the maintainer

Before Phase 2 lands in CI with real backend access:

1. **GitHub Actions secrets** (Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. **Supabase Dashboard** → Auth → URL Configuration → Site URL: `http://localhost:3000` for dev.
3. **`supabase link --project-ref skmwpbkrdsxlhlgsprmq`** once the CLI is installed.
4. **Vercel** — `vercel link`, add the three env vars above.

## Up next

**Phase 2 — Auth & Data Model.** Email + password sign up (with confirmation), login, logout, password reset, account deletion. Migrations for `profiles`, `borrowers`, `loans`, `loan_custom_schedule`, `payments`, `activity_log` with RLS on every user-owned table and a two-user Playwright + SQL test suite proving no cross-tenant reads or writes.
