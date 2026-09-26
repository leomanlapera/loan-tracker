# Loan Tracker

An **invite-only** web app for private lenders in the Philippines to record loans, log payments, and see what borrowers owe. Supports monthly compounding or simple interest, lump-sum or installment repayment, with a dashboard and six reports on collections, interest earned, and overdue accounts.

See [`loan_tracker_prd.md`](./loan_tracker_prd.md) for the full product spec, [`phases/`](./phases) for the delivery plan, and [`STATUS.md`](./STATUS.md) for the current build state.

## Stack

- **Next.js 16** — App Router, TypeScript, Server Actions, Turbopack
- **Supabase** — Auth + Postgres with Row Level Security; typed via generated `Database`
- **decimal.js** — money math (never JS floats)
- **Zod** — schema validation shared between forms and Server Actions
- **Tailwind v4 + shadcn/ui** (base-ui variant, Wealthy Greens palette, IBM Plex Sans/Mono)
- **Recharts** — balance-over-time chart on the loan detail page
- **Sonner** — toasts for save/edit/delete feedback
- **Vitest + Playwright** — engine unit tests, RLS integration tests, e2e + a11y + mobile-viewport smoke
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

App runs at http://localhost:3000 (which redirects to /login).

### First-time Supabase setup

Once `.env.local` is filled in, wire the repo to your Supabase project:

```bash
pnpm exec supabase login                                   # interactive, opens a browser
pnpm exec supabase link --project-ref YOUR-PROJECT-REF     # ref lives in supabase/config.toml
pnpm db:push                                               # applies all migrations to the remote
pnpm db:types                                              # regenerate database.types.ts after any schema change
```

In the Supabase Dashboard → Auth → URL Configuration, set **Site URL** to `http://localhost:3000` (and any deployed URLs) so email confirmation and reset links resolve.

**Invite your first user** — Supabase Dashboard → Authentication → Users → **Add user** (or send an invite). The app has no public sign-up.

Verify RLS is enforced with the integration suite:

```bash
pnpm test:integration
```

## Features

**Auth**
- Email + password with confirmation, password reset, account deletion (RA 10173)
- **Invite-only** — no public sign-up. Owner creates users from the Supabase Dashboard.
- Rate limiting on login (10 / 15 min per IP) + password reset (5 / hour)

**Core**
- **Borrowers** — CRUD, search, archive, delete-guarded when active loans exist
- **Loans** — CRUD with live engine preview, edit-gating when payments exist, custom repayment schedules, §10 written-agreement checkbox
- **Payments** — log/edit/soft-delete/restore with engine-based overpayment rejection and "pay off" shortcut
- **Loan detail** — summary tiles, full schedule with status chips, payment log, compound-vs-simple chart
- **Dashboard** — every PRD §5.6 tile plus a live overdue banner (top 5 overdue loans by name)
- **Reports** (all with date filters + CSV export)
  - Portfolio summary
  - Borrower statement
  - Collections (day/week/month × method)
  - Interest income (per-month interest portion of payments)
  - Aging (1-30 / 31-60 / 61-90 / 90+)
  - Write-offs
- **Activity log** — every mutation captured by Postgres triggers (SECURITY DEFINER); filterable page with diff view

**Product polish**
- **Cmd/Ctrl + K** command palette — search borrowers and loans from anywhere
- **Global "Log payment"** button in the sidebar and dashboard header — inline loan picker, one-click flow
- **Keyboard shortcuts** — `n` (context-aware new), `/` (focus search)
- **Sidebar** — icon-collapse mode with sign-out, theme toggle, collapse control at bottom
- **Dark mode** — light / dark / system, persisted, no FOUC
- **Row actions** on `/loans` — `⋯` menu with Log payment / Open / Edit
- **Toasts** for every save/edit/delete
- **Skeletons** on every list and detail page
- **Empty states** with a clear CTA
- **Sticky table headers** on long tables (schedule, payment log, reports)
- **Currency prefix (₱)** inside every money input; **eye toggle** on password fields

**Compliance & ops**
- Public `/privacy` and `/terms` pages (RA 10173 notice, Civil Code Art. 1956/1959, RA 9474 disclaimer)
- Ops runbook (`docs/ops.md`) — backups, PITR, restore, key rotation, incident checklist

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (engine + CSV util) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:integration` | Two-user RLS tests against the linked Supabase project |
| `pnpm e2e` | Playwright — smoke + a11y (Axe) + 375px mobile viewport |
| `pnpm format` | Prettier write |
| `pnpm db:diff` | Generate a migration from local schema changes |
| `pnpm db:reset` | Rebuild the DB from migrations (local or `--linked` for remote) |
| `pnpm db:push` | Push migrations to the linked remote project |
| `pnpm db:types` | Regenerate `src/lib/supabase/database.types.ts` from the linked project |

Anything else the CLI exposes is reachable via `pnpm exec supabase ...`.

## Project layout

```
src/
  app/
    page.tsx                 # / → redirects to /dashboard or /login
    error.tsx                # global error boundary
    layout.tsx               # theme init (no-FOUC), Toaster, ThemeProvider
    (app)/                   # authenticated routes; app-shell.tsx owns sidebar + Cmd+K
      dashboard/             # PRD §5.6 tiles + overdue banner (loans by name)
      borrowers/             # list (empty state), new, [id] (edit + delete guard)
      loans/                 # list (row actions, empty state), new, [id] detail, [id]/edit
      reports/               # 6 reports + CSV export route handlers
      activity/              # audit log with diff view
      settings/              # profile defaults + data export + danger zone
      command-palette/       # server action for Cmd+K entries
      error.tsx              # in-shell error boundary
    (auth)/                  # login, reset-password (invite-only, no sign-up)
    (legal)/                 # /privacy and /terms
    auth/callback/           # email-link handler
    api/export/              # RA 10173 ZIP export
  components/
    auth/                    # auth-form pieces
    form/                    # Field wrapper
    reports/                 # DateRangeForm, FilterField
    ui/                      # shadcn/ui primitives + MoneyInput, PasswordInput, Skeleton
    back-link.tsx            # BackLink with ArrowLeft icon
    command-palette.tsx      # Cmd+K palette
    empty-state.tsx          # Empty state block
    global-log-payment.tsx   # Global Log payment button + dialog
    keyboard-shortcuts.tsx   # n and / keyboard bindings
    theme.tsx                # ThemeProvider + ThemeToggle
  lib/
    engine/                  # pure TS calculation engine (see PRD §6)
      compute.ts             # main walk (schedule + summary)
      allocate.ts            # per-payment {toInterest, toPrincipal}
      pmt.ts / money.ts / period.ts / validate.ts / types.ts
    reports/                 # loans, date-range, collections, interest, aging
    supabase/                # client, server, middleware, admin, database.types
    validation/              # Zod schemas (auth, borrower, loan, payment, settings)
    csv.ts                   # RFC 4180 CSV + Response helper
    format.ts                # en-PH currency, dates, rate formatting
    labels.ts                # enum → human label maps (loan status, method, etc.)
    rate-limit.ts            # in-memory sliding-window limiter (server-only)
integration/                 # RLS test suite (test:integration)
supabase/
  migrations/                # SQL migrations, committed and pushed via db:push
  config.toml                # links to the remote project
tests/                       # Playwright: smoke, a11y, mobile
docs/                        # ops runbook
phases/                      # delivery plan
```

## Environment variables

See `.env.example`. Never commit `.env.local`. The service role key must stay server-side only — the `server-only` import in `src/lib/supabase/admin.ts` will hard-fail any bundle that leaks it to the browser.

## Contributing

- Every schema change ships as a Supabase migration in `supabase/migrations/`.
- Every user-owned table needs RLS + `integration/rls.test.ts` coverage before the phase closes.
- Engine changes require a Vitest case; PRD §6.6 cases are the source of truth for correctness.
- Money math is `decimal.js`, always. Never `Number` for anything that ends up on a lender's screen.
- Enum values never leak to the UI — add a mapping in `src/lib/labels.ts` and route through it.
