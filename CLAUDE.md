@AGENTS.md

# Loan Tracker — project context for Claude Code

Private-lender loan tracker for the Philippines. **Invite-only** (no public sign-up). Full spec: [`loan_tracker_prd.md`](./loan_tracker_prd.md). Phased delivery plan: [`phases/`](./phases). Current build state: [`STATUS.md`](./STATUS.md).

Before starting any non-trivial task, read `STATUS.md` — it lists which phase is complete, what's pending, and what the maintainer still needs to do manually.

## Stack

- Next.js 16 App Router, TypeScript, Server Components + Server Actions, Turbopack
- Supabase (Auth + Postgres) via `@supabase/ssr`; typed via generated `Database` in `src/lib/supabase/database.types.ts`
- `decimal.js` for all money math
- `zod` schemas shared between forms and Server Actions
- Tailwind v4 + shadcn/ui (base variant via `@base-ui/react` — no `asChild`; use `render={<Button />}` or wrap Link with `buttonVariants()` classes)
- `react-hook-form` + `@hookform/resolvers` for client forms
- Recharts for the loan detail chart
- `sonner` for toasts (mounted in root layout)
- Vitest for units + engine, Playwright for e2e smoke + a11y + mobile viewport
- Supabase CLI is a workspace dev dep — use `pnpm exec supabase ...` or the `pnpm db:*` scripts

## Non-negotiables

- **Money math is always `decimal.js`.** Never `Number` for principal, rate, interest, balance, payment, or anything a lender sees. Use `money()` from `src/lib/engine/money.ts` to round half-up to 2 decimals.
- **Every schema change ships as a Supabase migration** in `supabase/migrations/YYYYMMDDHHMMSS_name.sql`. No dashboard edits. After schema changes, run `pnpm db:types`.
- **RLS on every user-owned table.** New tables need policies AND coverage in `integration/rls.test.ts`.
- **Engine changes need a Vitest case.** PRD §6.6 acceptance cases are the correctness source of truth — they must stay green.
- **Service-role key stays server-side.** Never import `src/lib/supabase/admin.ts` from client code. The `server-only` import guards against it.
- **No borrower PII in URLs or logs.** Use IDs.
- **Reports and pages share the same helpers.** Page render + CSV export both call `src/lib/reports/*` — the pattern keeps numbers reconciled.
- **Enum values never leak to the UI.** Everything user-visible routes through `src/lib/labels.ts` (loan status, interest method, repayment type, period status, activity entity/action). If you add an enum, add a label.
- **No public sign-up.** The app is invite-only — do NOT reintroduce a `/sign-up` route or `signUpAction`. Add users via the Supabase Dashboard.

## Layout reminders

- `src/lib/engine/` — pure TS, no I/O, no `Date.now()`; `asOf` is always passed in. Runs identically in Node and browser.
  - `compute.ts` — main walk (schedule + summary)
  - `allocate.ts` — per-payment `{toInterest, toPrincipal, periodIndex}`
- `src/lib/reports/` — `loadAllLoans()`, `summarizeAt()`, and pure bucketing (`collections`, `interest`, `aging`) shared between report pages and CSV routes
- `src/lib/csv.ts` — RFC 4180 escaping + `csvResponse(filename, body)` for route handlers
- `src/lib/format.ts` — `formatPHP`, `formatDate` (MMM d, yyyy), `formatRate`; use everywhere numbers hit the DOM
- `src/lib/labels.ts` — enum → human label maps + safe getter fns
- `src/lib/rate-limit.ts` — in-memory sliding-window limiter (server-only); wired into `loginAction`, `requestPasswordResetAction`
- `src/app/(app)/app-shell.tsx` — client shell owning the collapsible sidebar, theme toggle, Cmd+K palette, keyboard shortcuts
- `src/app/(app)/` — authenticated routes; layout guard uses `redirect('/login')` if no session
- `src/app/(auth)/` — login + reset-password only (invite-only). `dynamic = 'force-dynamic'` because they read search params
- `src/app/page.tsx` — `/` is not a landing page; it just redirects to `/dashboard` (auth) or `/login` (unauth)
- `src/app/error.tsx` (global) and `src/app/(app)/error.tsx` (in-shell) — friendly retry + error digest
- `src/lib/supabase/` — `client` (browser), `server` (RSC/Server Actions), `middleware` (session refresh + route protection), `admin` (service role, server-only)
- `middleware.ts` at repo root — public paths whitelist (`/`, `/login`, `/reset-password`, `/auth`, `/privacy`, `/terms`); sends unauth users to `/login?next=X`; sends authed users on auth pages to `/dashboard`

## UI component quirks

- **base-ui `Select`** — trigger defaults to `w-full`. To show a friendly label instead of the raw value: `<SelectValue>{v => LABELS[v]}</SelectValue>`. Passing `<SelectValue />` shows the raw enum.
- **base-ui triggers** — no `asChild`. Use `render={<Button />}` on `AlertDialogTrigger`, `DropdownMenuTrigger`, etc.
- **Filter bars** — use `src/components/reports/filter-field.tsx` (`FilterField` + `HiddenLabel`) with the recipe `flex flex-wrap gap-3 rounded-md border p-3 [&>*]:w-full sm:[&>*]:w-40`. Buttons override with `sm:!w-auto`.
- **Money inputs** — use `<MoneyInput>` (has the `₱` prefix + thousands separators as you type). It's controlled: pass `value` (raw digit string) + `onChange(rawString)` — the display formatting is internal. Inside a `useForm`, wrap with `<Controller>`; do NOT spread `register()` (types will not match, and the `setValueAs` path only runs on submit).
- **base-ui `Select` inside a form** — always drive it through `<Controller>`; `watch()`/`setValue()` don't reliably re-render the base-ui trigger. Every `Select` in `loan-form.tsx`, `payment-dialog.tsx`, and `settings-form.tsx` follows this pattern — copy it for new forms.
- **Password inputs** — use `<PasswordInput>` (has the show/hide eye toggle).
- **Empty states** — use `<EmptyState icon={...} title="..." description="..." action={<Button>...</Button>} />` in list pages.
- **Skeletons** — put a `loading.tsx` sibling to `page.tsx` in any route where the RSC pass is slow; use the shared `<Skeleton>` component.
- **List search inputs** — use `<SearchWithHint>` (leading Search icon + trailing `⌘K` kbd chip); currently on `/borrowers` and `/loans`.
- **Sortable columns** — use `<SortableHeader columnKey="..." currentSort={sort} onSort={onSort}>Label</SortableHeader>` with helpers `toggleSort` + `compareBy` from `src/components/ui/sortable-header.tsx`. Nulls always sort last regardless of direction.
- **Recently viewed** — drop `<RecentTracker href="..." label="..." kind="borrower" | "loan" />` at the top of any detail page you want in the Cmd+K "Recent" list. Storage lives in `src/lib/recent-history.ts` (localStorage ring buffer, cap 8).
- **Submit buttons** — show a `<Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />` next to the label while pending (Server Actions: `useFormStatus`; RHF: `useTransition` + `isPending`).

## Common commands

| Task | Command |
|---|---|
| Unit + engine + CSV tests | `pnpm test` |
| RLS tests (hits remote) | `pnpm test:integration` |
| Full quality gate | `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm build` |
| New migration | `pnpm exec supabase migration new <name>` then edit under `supabase/migrations/` |
| Push migrations | `pnpm db:push` |
| Regenerate DB types after schema change | `pnpm db:types` |
| Dev server | `pnpm dev` |

## Working style

- Read `STATUS.md` and the relevant `phases/phase-0X-*.md` file before starting new work.
- Update `STATUS.md` when a phase closes or a big polish batch lands. Keep the phase table, verified checks, and "up next" section current.
- No commits or pushes without an explicit ask.
- CI is currently disabled (billing) — run the quality gate locally before pushing.
- For destructive Supabase actions (`db reset --linked`, dropping migrations, deleting users): confirm with the user first. The dev project is not empty.

## PRD open questions state

Track resolutions in the relevant phase file. As of writing (`PRD §12`):
- Q1 (partial installment) → **re-amortize** (Phase 1 decision).
- Q2 (penalty rate/fee for late payments) → **deferred to Phase 8**.
- Q3 (early payoff) → **full-month interest for current period** (Phase 1 decision).
- Q4 (interest-only repayment type) → **deferred to Phase 8**.
