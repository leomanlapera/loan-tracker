@AGENTS.md

# Loan Tracker — project context for Claude Code

Private-lender loan tracker for the Philippines. Full spec: [`loan_tracker_prd.md`](./loan_tracker_prd.md). Phased delivery plan: [`phases/`](./phases). Current build state: [`STATUS.md`](./STATUS.md).

Before starting any non-trivial task, read `STATUS.md` — it lists which phase is complete, what's pending, and what the maintainer still needs to do manually.

## Stack

- Next.js 16 App Router, TypeScript, Server Components + Server Actions
- Supabase (Auth + Postgres) via `@supabase/ssr`
- `decimal.js` for all money math
- `zod` schemas shared between forms and Server Actions
- Tailwind v4 + shadcn/ui (base variant via `@base-ui/react`)
- Vitest for units + engine, Playwright for e2e smoke
- Supabase CLI is a workspace dev dep — use `pnpm exec supabase ...` or the `pnpm db:*` scripts

## Non-negotiables

- **Money math is always `decimal.js`.** Never `Number` for principal, rate, interest, balance, payment, or anything a lender sees. Use the `money()` helper from `src/lib/engine/money.ts` to round to 2 decimals half-up.
- **Every schema change ships as a Supabase migration** in `supabase/migrations/YYYYMMDDHHMMSS_name.sql`. No dashboard edits.
- **RLS on every user-owned table.** New tables need policies AND coverage in `integration/rls.test.ts`.
- **Engine changes need a Vitest case.** PRD §6.6 acceptance cases are the correctness source of truth — they must stay green.
- **Service-role key stays server-side.** Never import `src/lib/supabase/admin.ts` from client code. The `server-only` import guards against it.
- **No borrower PII in URLs or logs.** Use IDs.

## Layout reminders

- `src/lib/engine/` — pure TS, no I/O, no `Date.now()` inside; `asOf` is always passed in. Runs identically in Node and browser.
- `src/app/(app)/` — authenticated routes; layout enforces `redirect('/login')` if no session.
- `src/app/(auth)/` — login / sign-up / reset flows. `dynamic = 'force-dynamic'` because they read search params.
- `src/lib/supabase/` — `client` (browser), `server` (RSC/Server Actions), `middleware` (session refresh + route protection), `admin` (service role, server-only).
- `middleware.ts` at repo root — public paths whitelist; sends unauth users to `/login?next=X`; sends authed users on auth pages to `/dashboard`.

## Common commands

| Task | Command |
|---|---|
| Unit + engine tests | `pnpm test` |
| RLS tests (hits remote) | `pnpm test:integration` |
| Full quality gate | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |
| New migration | `pnpm exec supabase migration new <name>` then edit under `supabase/migrations/` |
| Push migrations | `pnpm db:push` |
| Dev server | `pnpm dev` |

## Working style

- Read `STATUS.md` and the relevant `phases/phase-0X-*.md` file before starting new work — the plan states scope, deliverables, and acceptance criteria for the current phase.
- Update `STATUS.md` when a phase closes. Keep the phase table, verified checks, and "up next" section current.
- No commits or pushes without an explicit ask.
- CI is currently disabled (billing) — run the quality gate locally before pushing.

## PRD open questions in progress

Track resolutions in the relevant phase file. As of writing, `PRD §12`:
- Q1 (partial installment) → **re-amortize** (Phase 1 decision).
- Q3 (early payoff) → **full-month interest for current period** (Phase 1 decision, matches PRD MVP spec).
- Q4 (interest-only repayment type) → **deferred to Phase 8**.
- Q2 (penalty rate/fee for late payments) → **still open**; revisit before Phase 3 finalizes the loan form.
