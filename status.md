# Project Status

_Last updated: 2026-09-26_

## Current phase

**Phase 0 — Foundation & Setup: ✅ Complete**

See [`phases/README.md`](./phases/README.md) for the full plan.

## Phase progress

| # | Phase | Status |
|---|---|---|
| 0 | [Foundation & Setup](./phases/phase-00-foundation.md) | ✅ Complete |
| 1 | [Calculation Engine](./phases/phase-01-engine.md) | ⏳ Next |
| 2 | [Auth & Data Model](./phases/phase-02-auth-data.md) | ⏳ Pending |
| 3 | [Borrower & Loan CRUD](./phases/phase-03-borrowers-loans.md) | ⏳ Pending |
| 4 | [Payments & Loan Detail](./phases/phase-04-payments-detail.md) | ⏳ Pending |
| 5 | [Dashboard & Reports](./phases/phase-05-dashboard-reports.md) | ⏳ Pending |
| 6 | [Activity Log & Settings](./phases/phase-06-activity-settings.md) | ⏳ Pending |
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ⏳ Pending |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## What's shipped in Phase 0

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

**Testing**
- `vitest.config.ts` with `src/**/*.test.ts` pattern and jsdom env
- `src/lib/engine/index.test.ts` — placeholder passing test (real engine in Phase 1)
- `playwright.config.ts` — Chromium project, boots `pnpm build && pnpm start`
- `tests/smoke.spec.ts` — landing page smoke

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
- ✅ `pnpm test` (2/2)
- ✅ `pnpm build` (static prerender, middleware built)
- ✅ `pnpm dev` boots and serves the landing page with real Supabase env vars

## Known deferred

- shadcn `form` component slug not resolving from the current registry — add manually when the first form ships in Phase 3 (deps `react-hook-form` + `@hookform/resolvers` already installed).
- Supabase CLI not installed globally; needed for `pnpm db:*` scripts (`brew install supabase/tap/supabase` or `pnpm dlx supabase`).
- Vercel project not linked yet.

## Setup to-dos for the maintainer

Before Phase 1/2 lands in CI with real backend access:

1. **GitHub Actions secrets** (Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. **Supabase Dashboard** → Auth → URL Configuration → Site URL: `http://localhost:3000` for dev.
3. **`supabase link --project-ref skmwpbkrdsxlhlgsprmq`** once the CLI is installed.
4. **Vercel** — `vercel link`, add the three env vars above.

## Up next

**Phase 1 — Calculation Engine.** Pure TS module that computes schedules, balances, and status to the centavo per PRD §6, verified against the §6.6 acceptance cases in Vitest. This blocks any UI that shows numbers.
