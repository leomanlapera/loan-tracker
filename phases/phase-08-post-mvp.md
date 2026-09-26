# Phase 8 — Post-MVP Backlog

**Goal:** Home for PRD §4.2 items and every "nice to have" that surfaces during MVP build. Nothing here ships before Phase 7 launches.

## Backlog

### Borrower read-only portal (PRD §4.2)
- Invite flow: email link → magic link session scoped to borrower_id.
- Borrower sees only their own statement.
- No mutations available.

### PDF statements & receipts
- Server-side PDF render (React-PDF or Puppeteer on a Vercel function).
- Payment receipts emailed on payment log.

### Email reminders
- Cron (Supabase Edge Function or Vercel Cron) daily at 08:00 Asia/Manila.
- Templates: upcoming due (T-3, T-1), overdue (T+1, weekly).
- Per-loan opt-in.

### Daily / prorated interest for early payoff
- Engine extension: interest for partial period = `principal × r × days/30`.
- Replaces MVP full-month rule when enabled per loan.

### File attachments
- Supabase Storage bucket per user.
- Attach to loan (signed agreement) and payment (proof).
- RLS on storage matching table RLS.

## Backlog (discovered during MVP — add as items arise)

- Late-payment penalty rate (PRD §12 Q2).
- Interest-only repayment type (PRD §12 Q4).
- Report caching / SQL views if perf trips at >500 loans (Phase 5).
- Multi-currency, teams, credit scoring (PRD §4.3 — out of scope, kept here for visibility).

## Prioritization Rules

1. Anything a beta user hit twice.
2. Anything blocking a paying customer.
3. PRD §4.2 items in the order above.
4. Deferred PRD §12 open questions.

Reassess after 2 weeks of production usage.
