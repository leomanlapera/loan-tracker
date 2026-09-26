# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 7 — Polish, QA & Launch (code-executable slice): ✅ Complete.**
External items remain (lawyer review, beta, Lighthouse in prod).

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
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ✅ Code slice complete; external items open |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Phase 7 highlights

**E2E and accessibility** — `tests/`
- `smoke.spec.ts` — 6 public route smokes + 9 auth-gate assertions (every protected route redirects an unauthenticated visitor to `/login`)
- `a11y.spec.ts` — `@axe-core/playwright` scan on `/`, `/login`, `/sign-up`, `/reset-password`, `/privacy`, `/terms`. Fails on any `critical` or `serious` WCAG 2 A/AA violation. **All 6 routes clean.**
- `mobile.spec.ts` — 5 public routes verified at 375px viewport with no horizontal overflow
- **26 Playwright tests, all passing**

**Legal pages** — `/privacy` and `/terms`
- New `(legal)` route group with its own layout (branded header + shared footer)
- `PrivacyPage` — RA 10173 (Data Privacy Act) notice: collection, retention, access/rectification/erasure/portability rights, contact
- `TermsPage` — Civil Code Art. 1956/1959 written-agreement notice, Lending Company Regulation Act (RA 9474) callout, limitation of liability
- Signup form now links to both; footer includes both links

**Rate limiting** — `src/lib/rate-limit.ts`
- In-memory sliding-window limiter, keyed by `ip:purpose`, `server-only`
- Wired into `signUpAction` and `requestPasswordResetAction` — **5 attempts per hour** each
- Returns a user-friendly retry-after message
- Ops runbook documents the Upstash Redis swap for horizontal scale

**Ops runbook** — `docs/ops.md`
- Environments, backups + PITR verification procedure
- Single-user data restore from the activity log
- Key rotation checklist
- Account-deletion request handling
- Migration rollback (never `db reset --linked` on prod)
- Rate-limit backend swap notes
- Monitoring targets and incident checklist

## What's shipped (Phases 0–7)

**Framework & tooling**
- Next.js 16 App Router + Turbopack + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui variant, Wealthy Greens palette, IBM Plex Sans/Mono)
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `jszip`
- Dev: Vitest 3, jsdom 24, Playwright, `@axe-core/playwright`, Prettier, Supabase CLI (workspace dep), `ws` for Node 20 realtime shim

**Engine** — 39 Vitest cases (30 core + 3 allocation + 6 CSV)

**Supabase** — 8 migrations applied to remote, RLS enforced (19/19 integration tests), tightened payments policy, activity-log triggers writing on every mutation

**Routes** (31 total)
- Public: `/`, `/login`, `/sign-up`, `/reset-password`, `/reset-password/update`, `/auth/callback`, `/privacy`, `/terms`
- Authed pages: `/dashboard`, `/borrowers`, `/borrowers/new`, `/borrowers/[id]`, `/loans`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit`, `/reports`, `/reports/{portfolio,statement,collections,interest,aging,write-offs}`, `/activity`, `/settings`
- CSV route handlers: `/reports/{portfolio,statement,collections,interest,aging,write-offs}/export`
- Data export: `/api/export`

## Verified

- ✅ `pnpm lint` (3 non-blocking React Compiler notes on RHF `watch()`)
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (39/39)
- ✅ `pnpm test:integration` (19/19)
- ✅ `pnpm e2e` (26/26 including Axe a11y + 375px mobile viewport)
- ✅ `pnpm build` — 31 routes

## Phase 7 items still requiring you (external)

These weren't touched — they need a human:

1. **Legal review of `/privacy` and `/terms` by a Philippine lawyer.** The pages are drafted defensively but not attorney-reviewed. Please have someone with LOTS of RA 10173 / Lending Company Regulation Act experience read them before beta.
2. **Beta with 3–5 real lenders.** Recruit, onboard, collect balance reconciliations to confirm the engine matches their manual records.
3. **Lighthouse on production URL under 4G throttle.** Local metrics aren't representative; run after Vercel deploy.
4. **Supabase paid tier for PITR** — if you want point-in-time recovery in prod (recommended).

## Known deferred

- Interest-only repayment type — Phase 8 backlog
- Late-payment penalty rate/fee (PRD §12 Q2) — Phase 8 backlog
- Vercel project not linked yet
- CI (GitHub Actions) — re-add when billing allows

## Setup to-dos for the maintainer

- **Add `/privacy` and `/terms` to Supabase Dashboard → Auth → URL Configuration → Additional Redirect URLs**? Not needed — those pages are static, don't participate in auth flows.
- Still pending from earlier phases: Site URL config, Vercel link + env vars for deploy.

## CI

Not configured. Quality gate is local: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm e2e && pnpm build`.

## Up next

The **MVP is code-complete**. Deployment (Vercel), lawyer sign-off, and beta are all that stand between here and launch. When you're ready, jump into `phases/phase-08-post-mvp.md` — top of the backlog is the borrower read-only portal, PDF statements, and email reminders.
