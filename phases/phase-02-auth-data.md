# Phase 2 — Auth & Data Model

**Goal:** Users can sign up, log in, and reset passwords. All tables from PRD §7 exist with RLS enforced and tested.

**Duration:** 4–6 days
**Depends on:** Phase 0
**Blocks:** Phases 3–6

## Scope

### Auth (PRD §5.1)
- Email + password sign up with confirmation email.
- Login, logout, password reset.
- Magic link toggle (behind a feature flag, off by default).
- `@supabase/ssr` cookie sessions working with Server Components and Server Actions.
- Route protection: middleware redirects unauthenticated users away from app routes.
- Public routes: landing, login, sign up, password reset.
- Account deletion flow (RA 10173): confirmation + cascade delete of user data.

### Data Model (PRD §7)
Migrations for:
- `profiles`
- `borrowers`
- `loans`
- `loan_custom_schedule`
- `payments`
- `activity_log`

Every user-owned table:
- `id uuid pk`, `created_at`, `updated_at` (trigger).
- `user_id uuid references auth.users`.
- RLS policies: `user_id = auth.uid()` on select/insert/update/delete.
- Indexes: `loans(user_id, status)`, `payments(loan_id, paid_on)`, `borrowers(user_id)`.

Enums: `interest_method`, `repayment_type`, `after_maturity`, `loan_status`, `payment_method`, `activity_action`.

### Testing
- Two-user Playwright fixture: user A cannot read/write user B's rows via the app.
- SQL-level RLS test (Vitest against local Supabase) for each table's four operations.

## Deliverables

- `supabase/migrations/000X_*.sql` files, one per logical change.
- `/lib/supabase/{server,client,middleware}.ts` helpers.
- Auth pages under `/app/(auth)/{login,sign-up,reset-password}/page.tsx`.
- `middleware.ts` at repo root for session refresh + route protection.
- RLS test suite green in CI.

## Acceptance Criteria

- [ ] New user can sign up, confirm email, log in, reset password, delete account.
- [ ] Deleting an account removes all rows in user-owned tables.
- [ ] Two-user Playwright test proves no cross-tenant reads or writes.
- [ ] All migrations apply cleanly from an empty database.
- [ ] Service role key is not present in any client bundle (verified via Next.js build output check).

## Risks / Notes

- Do not write to `activity_log` from app code — that comes in Phase 6 via triggers.
- Confirm Supabase email templates use production sender before Phase 7.
