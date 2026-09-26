# Project Status

_Last updated: 2026-09-26_

## Current phase

**MVP is code-complete + polished.** Phase 7 code slice done; external items (lawyer review, beta, Lighthouse in prod) remain.

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
| 7 | [Polish, QA & Launch](./phases/phase-07-launch.md) | ✅ Code slice + UX polish complete; external items open |
| 8 | [Phase 2 Backlog](./phases/phase-08-post-mvp.md) | 📌 Post-MVP |

## Polish and UX improvements (post-Phase 7)

**Theme & typography**
- Wealthy Greens OKLCH palette (light + dark), both mapped through shadcn tokens
- IBM Plex Sans (body) + IBM Plex Mono (numbers) via `next/font/google`
- **Dark mode toggle** in the sidebar footer (light / dark / system), persisted via localStorage; inline `<script>` in `<head>` prevents FOUC on first paint

**App shell**
- Sidebar navigation (≥md, icon-collapse mode) instead of top nav; sticky, `sticky top-0 h-screen`
- Mobile (<md): fixed bottom tab bar replaces the sidebar (Home / Loans / raised "+" / Borrowers / More)
- "Signed in as email" + Sign out + Theme + Collapse cluster at the sidebar footer (mirrored in the mobile More sheet)
- No top header; no shared footer (content-first)
- Full-width main content (no `max-w-6xl` cap)

**Global actions**
- **`GlobalLogPaymentButton`** in the sidebar (primary CTA) and on the dashboard header — searchable loan picker + inline payment form. Zero navigation to log a payment.
- **Cmd/Ctrl + K command palette** (`src/components/command-palette.tsx`) — fuzzy search of borrowers + loans, `↑/↓/Enter` navigation, "Recent" section (localStorage ring buffer, cap 8) when the query is empty
- **Keyboard shortcuts** — `n` (context-aware new borrower/loan), `/` (focus first search input), `?` (open cheatsheet dialog); auto-skipped while typing in inputs

**Forms**
- New borrower / new loan / edit loan share the same shell: Breadcrumbs → h1 → description → Card-wrapped form
- `MoneyInput` component with a `₱` prefix inside the field and thousands separators as you type — used on principal, custom-schedule rows, and every payment amount input
- `PasswordInput` component with Eye/EyeOff toggle
- `Checkbox` (shadcn) replaces all raw `<input type="checkbox">`
- Filter bars: shared `FilterField` + `flex flex-wrap gap-3 [&>*]:w-full sm:[&>*]:w-40` recipe across `/activity` and all six reports; buttons override with `sm:!w-auto`
- Every `Select` shows a friendly label (via `<SelectValue>{v => LABEL_MAP[v]}</SelectValue>`) instead of raw enum values; `SelectTrigger` default is `w-full` so it fills the field

**Tables**
- **Sticky table headers** across the app (Schedule, Payment log, Reports)
- **Sortable columns** on `/loans` (Borrower, Start, Principal, Rate, Balance, Next due, Status) and `/borrowers` (Name, Active loans, Outstanding); nulls sort last
- **Balance sparklines** on `/loans` rows — pure-SVG mini-chart under the Balance amount
- **Row actions** on `/loans` list — `⋯` dropdown with "Log payment" (opens dialog inline), "Open loan", "Edit loan"
- **Empty states** with icon + headline + CTA on `/borrowers` and `/loans`
- All enum badges use `src/lib/labels.ts` (loan status, interest method, repayment type, period status, activity entity, activity action) — no more `equal_installments` in the UI

**Feedback**
- **Sonner toasts** mounted at the root; wired into every save/edit/delete (borrower/loan/payment/settings) with themed styling
- **Loading spinners** on every submit button (auth, borrower, loan, payment, settings, global log-payment)
- **Delete-payment confirmation dialog** (soft delete still, but requires confirm)
- **Dashboard overdue banner** lists the top 5 overdue loans (borrower name + days past due + shortfall) instead of "N overdue"
- **Dashboard onboarding card** appears when the user has no loans yet — Sparkles icon + Add borrower / New loan CTAs

**Loading & errors**
- `Skeleton` component + route-level `loading.tsx` files for `/dashboard`, `/loans`, `/loans/[id]`, `/borrowers`, `/reports`
- `src/app/error.tsx` (global) + `src/app/(app)/error.tsx` (in-shell) — friendly retry + error id

**Navigation micro-fixes**
- `<Breadcrumbs items={[...]} />` on every detail/nested page (11 pages) — ChevronRight separators, `aria-current="page"` on the last crumb; replaced the earlier `BackLink`
- Legal `/privacy` + `/terms` retained (public routes; header + footer inside their own `(legal)` layout)

**Invite-only auth (breaking change)**
- **Removed sign-up entirely.** Deleted `/sign-up`, `/sign-up/check-inbox`, `signUpAction`, `resendConfirmationAction`, `signUpSchema`. Middleware public paths no longer include `/sign-up`. Tests assert `/sign-up` now returns 404.
- **Homepage redirects.** `/` → `/dashboard` (auth) or `/login` (unauth). No public landing page.
- **Login form redesigned** — hero mint LockKeyhole mark, "Welcome back" h1, autofocus email, better labels/placeholders, "Forgot password?" full phrase, invite-only footnote.

**Structural**
- **Login now rate-limited** — 10 attempts / 15 min per IP (was: only sign-up + reset)
- **Node 20 realtime shim** for the Supabase integration tests

**Polish batch #7 (2026-09-26)**
- **Keyboard shortcut cheatsheet** — press `?` anywhere to open a Dialog listing every shortcut (⌘K/Ctrl+K, `/`, `?`, `n`). Grouped by Navigation / Actions with per-row `<kbd>` chips. Also opened programmatically via `window.dispatchEvent(new Event('shortcuts:open'))` — wired to a "Keyboard shortcuts" row in the mobile "More" sheet.

**Polish batch #6 (2026-09-26)**
- **Mobile bottom tab bar** — on `<md` viewports the sidebar is hidden (`hidden md:flex`) and a fixed bottom bar takes over (Home / Loans / **[+ Log payment]** / Borrowers / More). The center "+" is a raised primary-tinted circle that opens the existing `<GlobalLogPaymentButton>` dialog. Main content gets `pb-24 md:pb-6` so nothing hides under the bar. `env(safe-area-inset-bottom)` respected for iOS notches.
- **"More" sheet** — Dialog with Reports, Activity, Settings + a divider, then Theme toggle and Sign out (with "Signed in as {email}" header). Tapping a link auto-closes via `<DialogClose render={<Link />}>`.

**Polish batch #5 (2026-09-26)**
- **Breadcrumbs across the app shell** — new `<Breadcrumbs items={[{ href, label }]} />` component (ChevronRight separators, last crumb marked `aria-current="page"`). Replaced `BackLink` on all 11 detail/nested pages: `/borrowers/new`, `/borrowers/[id]`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit` (three levels), and each of the 6 report pages. `back-link.tsx` deleted.

**Polish batch #4 (2026-09-26)**
- **Balance sparklines on `/loans` rows** — new `<Sparkline points={number[]} />` component (pure SVG, ~72×16, primary-color line + soft area fill). Rendered under the Balance amount using the engine's `schedule[].closingBalance` for past periods, pinned to the current balance as the final point. No new deps, no client JS.

**Polish batch #3 (2026-09-26)**
- **Print-friendly borrower statement** — `Print` button on `/reports/statement` (next to Download CSV) fires `window.print()`; page renders with a letterhead (borrower name + contact + address on the left, lender `display_name` + generated date + period range on the right), one loan per page, flat greyscale borders on tables, and repeated table headers across page breaks
- Global `@media print` block in `globals.css` — A4 with 14/12 mm margins, `.print-hide` utility (also hides sonner Toaster + dialog overlays), `.print-doc` container for scoped print styles, `data-print-card` for tabular loan cards, `data-print-page-break` marker

**Polish batch #2 (2026-09-26)**
- **Formatted money inputs** — `MoneyInput` is now controlled, shows thousands separators as you type (`10000` → `10,000`); wired via `Controller` in loan form (principal + custom schedule rows), payment dialog, global log-payment button
- **Loading spinners in submit buttons** — `Loader2` on auth `SubmitButton` (login, reset), borrower form, loan form, payment dialog, settings form, global log-payment
- **Onboarding empty state on `/dashboard`** — Welcome card with `Sparkles` icon + CTAs (Add borrower / New loan) shown when `!hasAnyLoans`
- **Sortable table columns** — new `SortableHeader` + `compareBy` + `toggleSort` (nulls last); `/loans` (Borrower, Start, Principal, Rate, Balance, Next due, Status; default Next due asc) and `/borrowers` (Name, Active loans, Outstanding; default Name asc)
- **Cmd+K recently viewed** — `RecentTracker` client component pushes to a localStorage ring buffer (cap 8) on every visit to `/borrowers/[id]` and `/loans/[id]`; palette shows a "Recent" section with `Clock` icon when the query is empty; labels re-hydrate from live data so renamed borrowers show the fresh name
- **⌘K hint chip in list search** — new `SearchWithHint` (Search icon + `<kbd>⌘K</kbd>`) on `/borrowers` and `/loans`
- **Borrower select fix** — Loan form + payment dialog + settings form now use `Controller` universally (was: `register` + `setValue`, which didn't reliably re-render the base-ui `Select`); the borrower dropdown on `/loans/[id]/edit` is disabled with a hint (borrower cannot change post-creation)

## Verified

- ✅ `pnpm lint` (0 errors; 2 non-blocking React Compiler notes on RHF `watch()`)
- ✅ `pnpm typecheck`
- ✅ `pnpm test` (39/39 — engine + allocation + CSV)
- ✅ `pnpm test:integration` (19/19 last run — RLS + activity triggers)
- ✅ `pnpm e2e` (23/23 — smoke + auth gates + a11y + mobile viewport)
- ✅ `pnpm build` — 27 routes

## What's shipped

**Framework & tooling**
- Next.js 16 App Router + Turbopack + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui variant, Wealthy Greens palette, IBM Plex Sans/Mono)
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `decimal.js`, `zod`, `recharts`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `jszip`, `sonner`
- Dev: Vitest 3, jsdom 24, Playwright, `@axe-core/playwright`, Prettier, Supabase CLI (workspace dep), `ws` for Node 20 realtime shim

**Engine** — 39 Vitest cases (PRD §6.6 to the centavo)

**Supabase** — 8 migrations applied to remote, RLS enforced (19/19 integration tests), tightened payments policy, activity-log triggers on every mutation

**Routes** (27 total)
- Public: `/` (redirect), `/login`, `/reset-password`, `/reset-password/update`, `/auth/callback`, `/privacy`, `/terms`
- Authed pages: `/dashboard`, `/borrowers`, `/borrowers/new`, `/borrowers/[id]`, `/loans`, `/loans/new`, `/loans/[id]`, `/loans/[id]/edit`, `/reports`, `/reports/{portfolio,statement,collections,interest,aging,write-offs}`, `/activity`, `/settings`
- CSV route handlers: `/reports/{portfolio,statement,collections,interest,aging,write-offs}/export`
- Data export: `/api/export`

## Phase 7 items still requiring you (external)

1. **Legal review of `/privacy` and `/terms` by a Philippine lawyer.** Drafts are defensive but not attorney-vetted.
2. **Beta with 3–5 real lenders.** Reconcile their manual balances against the app.
3. **Lighthouse on production URL under 4G throttle.** Local metrics aren't representative.
4. **Supabase paid tier for PITR** if you want point-in-time recovery in prod.
5. **Invite users manually** via the Supabase Dashboard → Authentication → Users (send invite / create user). App has no self-serve sign-up.

## Known deferred

- Pagination on lists and reports — only matters ~500+ loans
- Heading hierarchy fix — Axe already green (cosmetic-only)
- Interest-only repayment type — Phase 8 backlog
- Late-payment penalty rate/fee (PRD §12 Q2) — Phase 8 backlog
- Vercel project not linked yet
- CI (GitHub Actions) — re-add when billing allows

## Setup to-dos for the maintainer

- Supabase Dashboard → Auth → URL Configuration → Site URL: `http://localhost:3000` (and your production URL)
- Vercel — `vercel link` + env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Invite the first user via Supabase Dashboard (no public sign-up)

## CI

Not configured. Quality gate is local:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm e2e && pnpm build
```

## Up next

The **MVP is code-complete and polished**. Deploy to Vercel, get legal sign-off, invite beta users. After launch, `phases/phase-08-post-mvp.md` — borrower read-only portal, PDF statements, email reminders, prorated payoff, file attachments, late-payment penalty rate.
