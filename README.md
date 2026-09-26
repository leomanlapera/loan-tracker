# Loan Tracker

A web app for private lenders in the Philippines to record loans, log payments, and see what borrowers owe. Supports monthly compounding or simple interest, lump-sum or installment repayment, with reports on collections, interest earned, and overdue accounts.

See [`loan_tracker_prd.md`](./loan_tracker_prd.md) for the full product spec and [`phases/`](./phases) for the delivery plan.

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
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for local migrations

## Setup

```bash
pnpm install
cp .env.example .env.local
# fill in Supabase URL and keys from your project's API settings
pnpm dev
```

App runs at http://localhost:3000.

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
| `pnpm e2e` | Playwright end-to-end tests |
| `pnpm format` | Prettier write |
| `pnpm db:diff` | Generate a migration from local schema changes |
| `pnpm db:reset` | Rebuild the local Supabase DB from migrations |
| `pnpm db:push` | Push migrations to the linked remote project |

## Project layout

```
src/
  app/                 # Next.js App Router routes
  lib/
    engine/            # Pure TS calculation engine (see PRD §6)
    supabase/          # Client/server/middleware helpers
supabase/
  migrations/          # SQL migrations, committed
tests/                 # Playwright specs
phases/                # Delivery plan
```

## Environment variables

See `.env.example`. Never commit `.env.local`. The service role key must stay server-side only.

## Contributing

- Every schema change ships as a Supabase migration in `supabase/migrations/`.
- Every user-owned table needs RLS + tests before the phase closes.
- Engine changes require a Vitest case; PRD §6.6 cases are the source of truth for correctness.
