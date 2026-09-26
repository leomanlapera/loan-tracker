# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 2 — Auth & Data Model: ✅ Complete (code); migrations pending push**

See [`phases/README.md`](./phases/README.md) for the full plan.

## Phase progress

| # | Phase | Status |
|---|---|---|
| 0 | [Foundation & Setup](./phases/phase-00-foundation.md) | ✅ Complete |
| 1 | [Calculation Engine](./phases/phase-01-engine.md) | ✅ Complete |
| 2 | [Auth & Data Model](./phases/phase-02-auth-data.md) | ✅ Complete (migrations pending push) |
| 3 | [Borrower & Loan CRUD](./phases/phase-03-borrowers-loans.md) | ⏳ Next |
| 4 | [Payments & Loan Detail](./phases/phase-04-payments-detail.md) | ⏳ Pending |
| 5 | [Dashboard & Reports](./phases/phase-05-dashboard-reports.md) | ⏳ Pending |
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ⏳ Pending |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Pending |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 2 highlights

**Migrations** — `supabase/migrations/`
- `20260926100000_enums_and_helpers.sql` — all enums (`interest_method`, `repayment_type`, `after_maturity`, `loan_status`, `payment_method`, `activity_action`, `activity_entity`) + `tg_set_updated_at()` trigger fn
- `20260926100100_profiles.sql` — profiles table + `handle_new_user()` trigger that auto-creates a profile row on signup + RLS (self-only)
- `20260926100200_borrowers.sql` — borrowers + RLS + indexes (`user_id`, partial for active)
- `20260926100300_loans.sql` — loans (`numeric(14,2)`, `numeric(7,4)`, enums, `agreement_in_writing` for §10 compliance) + `loan_custom_schedule` + RLS + indexes (`user_id, status`; `borrower_id`)
- `20260926100400_payments.sql` — payments with soft delete + RLS + indexes (`loan_id, paid_on`)
- `20260926100500_activity_log.sql` — table only; **no INSERT/UPDATE/DELETE policies** so only triggers (Phase 6, SECURITY DEFINER) may write

**Auth**
- Server actions in `src/app/(auth)/actions.ts` — `loginAction`, `signUpAction`, `signOutAction`, `requestPasswordResetAction`, `updatePasswordAction`, `deleteAccountAction`
- Zod-validated inputs in `src/lib/validation/auth.ts`
- Pages: `/login`, `/sign-up`, `/reset-password`, `/reset-password/update`
- `/auth/callback` route handler exchanges the code from email links for a session
- Middleware now bounces authenticated users away from login/signup, and preserves the `next` query param through the login redirect
- `src/lib/supabase/admin.ts` — service-role client for account deletion; `server-only` import blocks client bundling
- `src/app/(app)/layout.tsx` — protected shell with sign-out button; `/dashboard` placeholder

**Testing** — `integration/rls.test.ts` + `pnpm test:integration`
- Two throwaway users created via admin API (`rls-a-*`, `rls-b-*`)
- Asserts cross-tenant reads and writes fail on every user-owned table (borrowers, loans, loan_custom_schedule, payments, activity_log, profiles)
- Cleanup deletes both users; cascade removes their data
- Kept out of the fast `pnpm test` suite — runs against your real dev project

## What's shipped (Phases 0–2)

**Framework & tooling**
- Next.js 16 (App Router, Turbopack, TypeScript, `src/` layout)
- Tailwind CSS v4 + shadcn/ui (button, input, card, table, dialog, label)
- Runtime deps: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `server-only`
- Dev deps: Vitest 3 + `@vitejs/plugin-react`, jsdom 24, Playwright, Prettier + tailwind plugin

**Engine** (Phase 1) — `src/lib/engine/`, 30 passing tests, PRD §6.6 cases to the centavo

**Supabase**
- `src/lib/supabase/{client,server,middleware,admin}.ts` using `@supabase/ssr` + admin service-role helper
- Root `middleware.ts` — session refresh + redirect logic (unauth → login with `next=`, auth → dashboard from auth pages)
- `supabase/config.toml` linked to remote project ref `skmwpbkrdsxlhlgsprmq`
- `supabase/README.md` documents the push flow

**Routes**
- `/` — landing (public, shows different CTAs based on session)
- `/login`, `/sign-up`, `/reset-password`, `/reset-password/update` — auth
- `/auth/callback` — email link handler
- `/dashboard` — protected placeholder (real tiles land in Phase 5)

**Config**
- `.nvmrc` → Node 20
- `.prettierrc` + `.prettierignore`
- `.env.example` template; `.env.local` gitignored
- `tsconfig.json` excludes `tests/`, `playwright-report/`, `.next/`
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:integration`, `e2e`, `format`, `format:check`, `db:diff`, `db:reset`, `db:push`

## Verified

- ✅ `pnpm lint`
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (30/30)
- ✅ `pnpm build` — 7 routes, all dynamic (middleware attached)
- ✅ `pnpm dev` — `/` → 200, `/login` → 200, `/dashboard` → 307 → `/login?next=/dashboard`

## Known deferred

- shadcn `form` component slug not resolving from the current registry — will render forms with plain fields until Phase 3 (deps `react-hook-form` + `@hookform/resolvers` already installed).
- Supabase CLI not installed globally; needed for `pnpm db:*` scripts (`brew install supabase/tap/supabase`).
- Vercel project not linked yet.
- Interest-only repayment type — Phase 8 backlog.
- Playwright two-user auth flow test — deferred to Phase 3 when there's a real CRUD flow to walk through.

## Setup to-dos for the maintainer

Before Phase 3 UI can hit real data, YOU need to:

1. **Install the Supabase CLI** (one-time):
   ```bash
   brew install supabase/tap/supabase   # macOS
   ```
2. **Link and push migrations**:
   ```bash
   supabase login
   supabase link --project-ref skmwpbkrdsxlhlgsprmq
   pnpm db:push
   ```
3. **Supabase Dashboard** → Auth → URL Configuration → Site URL: `http://localhost:3000` (for dev email links).
4. **Run RLS tests** to confirm the migrations are correct:
   ```bash
   pnpm test:integration
   ```
5. **Vercel** — `vercel link`, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## CI

Not configured. Quality checks run locally via `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm e2e`. Re-add a GitHub Actions workflow when the account can host runners.

## Up next

**Phase 3 — Borrower & Loan CRUD.** Lender creates/edits/archives borrowers and creates/edits/closes/archives loans, with a live engine-powered preview of the schedule as they type. Loan form enforces PRD §5.3 editing rules and the §10 "interest terms in writing" checkbox. Blocks Phase 4.
