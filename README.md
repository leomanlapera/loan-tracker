# Loan Tracker

A web app for private lenders in the Philippines to record loans, log payments, and see what borrowers owe. Supports monthly compounding or simple interest, lump-sum or installment repayment, with reports on collections, interest earned, and overdue accounts.

See [`loan_tracker_prd.md`](./loan_tracker_prd.md) for the full product spec, [`phases/`](./phases) for the delivery plan, and [`STATUS.md`](./STATUS.md) for the current build state.

## Stack

- **Next.js 16** — App Router, TypeScript, Server Actions
- **Supabase** — Auth + Postgres with Row Level Security
- **decimal.js** — money math (never JS floats)
- **Zod** — schema validation shared between forms and Server Actions
- **Tailwind + shadcn/ui** — UI
- **Recharts** — charts
- **Vitest + Playwright** — engine unit tests and e2e smoke
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
```

In the Supabase Dashboard → Auth → URL Configuration, set **Site URL** to `http://localhost:3000` so email confirmation links resolve correctly in dev.

Verify RLS is enforced with the integration suite:

```bash
pnpm test:integration
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (engine + unit) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:integration` | Two-user RLS tests against the linked Supabase project |
| `pnpm e2e` | Playwright end-to-end tests |
| `pnpm format` | Prettier write |
| `pnpm db:diff` | Generate a migration from local schema changes |
| `pnpm db:reset` | Rebuild the local Supabase DB from migrations |
| `pnpm db:push` | Push migrations to the linked remote project |

Anything else the CLI exposes is reachable via `pnpm exec supabase ...`.

## Project layout

```
src/
  app/
    (app)/               # authenticated routes (dashboard, borrowers, loans, ...)
    (auth)/              # login, sign-up, reset-password
    auth/callback/       # email-link handler
  components/
    auth/                # small pieces used by auth pages
    ui/                  # shadcn/ui primitives
  lib/
    engine/              # pure TS calculation engine (see PRD §6)
    supabase/            # client/server/middleware/admin helpers
    validation/          # Zod schemas
integration/             # RLS test suite (test:integration)
supabase/
  migrations/            # SQL migrations, committed and pushed via db:push
  config.toml            # links to the remote project
tests/                   # Playwright specs
phases/                  # delivery plan
```

## Environment variables

See `.env.example`. Never commit `.env.local`. The service role key must stay server-side only — the `server-only` import in `src/lib/supabase/admin.ts` will hard-fail any bundle that leaks it to the browser.

## Contributing

- Every schema change ships as a Supabase migration in `supabase/migrations/`.
- Every user-owned table needs RLS + `integration/rls.test.ts` coverage before the phase closes.
- Engine changes require a Vitest case; PRD §6.6 cases are the source of truth for correctness.
- Money math is `decimal.js`, always. Never `Number` for anything that ends up on a lender's screen.
