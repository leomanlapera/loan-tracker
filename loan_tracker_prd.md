# Product Requirement Document (PRD)

## 1. Document Control
* **Project Name:** Loan Tracker (Compounding Interest)
* **Version:** 0.2
* **Date:** September 25, 2026
* **Status:** Draft
* **Stack:** Next.js (App Router, TypeScript), Supabase (Auth + Postgres), Vercel

---

## 2. Product Overview
A web app for private lenders in the Philippines to record loans, log payments, and see exactly what each borrower owes. It supports monthly compounding or simple interest, lump-sum or installment repayment, and gives clear reports on collections, interest earned, and overdue accounts.

All data is saved per user in Supabase. Schedules and balances are always recalculated from the loan settings and the payment log, so the numbers stay consistent.

---

## 3. Users & Roles

| Role | MVP | Description |
|---|---|---|
| Lender (account owner) | Yes | Creates borrowers and loans, logs payments, views reports. |
| Borrower (read-only) | No (Phase 2) | Views their own loan statement via invite or share link. |

Each lender only ever sees their own data.

---

## 4. Scope

### 4.1 MVP
* Auth (sign up, log in, log out, password reset)
* Borrower management
* Loan management (create, edit, close, archive)
* Payment logging with edit history
* Schedule engine (compound and simple)
* Loan detail page: schedule, planned vs. actual, compound vs. simple chart
* Dashboard
* Reports with CSV export
* Activity log
* Settings (profile, currency display, grace period default)

### 4.2 Phase 2
* Borrower read-only access
* PDF statements and receipts
* Email reminders for upcoming and overdue payments
* Daily/prorated interest for early payoff
* File attachments (signed agreement, proof of payment)

### 4.3 Out of Scope
* Processing actual payments (no GCash/Maya/bank integration; payments are recorded manually)
* Multi-currency
* Multi-user teams sharing one account
* Credit scoring or borrower verification

---

## 5. Functional Requirements

### 5.1 Authentication
* Email + password sign up with email confirmation.
* Magic link login (optional toggle).
* Password reset via email.
* Sessions handled with `@supabase/ssr` (cookie-based, works with Server Components and Server Actions).
* Protected routes: everything except landing, login, sign up, and public calculator.
* User can delete their account and all data (Data Privacy Act).

### 5.2 Borrowers
* Fields: full name (required), mobile number, email, address, notes.
* List view with search, total outstanding per borrower, and count of active loans.
* A borrower with active loans cannot be deleted, only archived.

### 5.3 Loans
**Inputs**

| Field | Rules |
|---|---|
| Borrower | Required |
| Principal | Required, > 0, max 2 decimals |
| Monthly interest rate | Required, 0–100%, up to 4 decimals (e.g. 5.0000) |
| Tenure | Required, 1–120 months |
| Start date | Required. Due dates are derived from this. |
| Interest method | `compound` (default) or `simple` |
| Repayment type | `lump_sum`, `equal_installments`, or `custom` |
| After maturity | `continue_accruing` (default) or `stop_accruing` |
| Grace period | Days after due date before marked overdue. Default 0. |
| Notes / reference | Optional |

**Statuses**
* `active` – has a balance and is within or past tenure
* `overdue` – a scheduled amount is unpaid past due date + grace period (computed, not stored)
* `paid` – balance reaches ₱0.00 (set automatically)
* `written_off` – lender marks as uncollectible; remaining balance shown as loss in reports
* `cancelled` – created by mistake; excluded from all reports

**Editing rules**
* Principal, rate, start date, and interest method can be edited only if no payments exist. After the first payment, changes require a confirmation and are recorded in the activity log.

### 5.4 Payments
* Fields: amount (required), date paid (required, not in the future), method (`cash`, `gcash`, `maya`, `bank_transfer`, `check`, `other`), reference number, note.
* Allocation order: accrued interest first, then principal.
* A payment larger than the payoff amount on that date is rejected, and the app shows the exact payoff amount.
* "Pay off loan" shortcut fills in the exact payoff amount for today.
* Edits and deletes are soft (kept in history) and logged in the activity log.

### 5.5 Loan Detail Page
* Summary: principal, rate, method, start date, maturity date, current balance, total paid, interest earned to date, next due date and amount.
* Schedule table per month:
  * Period #, due date
  * Opening balance
  * Interest accrued
  * Scheduled payment
  * Actual payments (sum for the period)
  * Closing balance (new capital base)
  * Status: `paid`, `partial`, `unpaid`, `upcoming`
* Payment log list with edit/delete.
* Chart: balance over time, compound vs. simple, using the same payments.

### 5.6 Dashboard
* Total principal lent (active loans)
* Total outstanding balance
* Interest earned (this month, this year, all time)
* Collections this month
* Overdue loans count and amount
* Due in the next 7 days list
* Recent payments list

### 5.7 Reports
All reports have date range filters and CSV export.

| Report | Contents |
|---|---|
| Portfolio summary | Per loan: borrower, principal, rate, method, status, balance, total paid, interest earned |
| Borrower statement | One borrower's loans, full schedule, and payment history |
| Collections | Payments received in a period, grouped by day/week/month and by method |
| Interest income | Interest earned per month (interest portion of payments received) |
| Aging / overdue | Overdue amounts grouped by 1–30, 31–60, 61–90, 90+ days |
| Write-offs | Written-off loans and amounts lost |

### 5.8 Activity Log
* Records create/update/delete on borrowers, loans, and payments.
* Stores who, when, what changed (before/after values as JSON).
* Read-only in the UI.

### 5.9 Settings
* Display name
* Default grace period
* Default interest method and repayment type
* Currency display: PHP (`en-PH`), fixed for MVP
* Timezone: Asia/Manila, fixed for MVP

---

## 6. Calculation Specification

### 6.1 General rules
* All money math uses `decimal.js` (never JS floats). Stored as `numeric(14,2)`.
* Rates stored as a percentage with 4 decimals, e.g. `5.0000`.
* Rounding: half-up to 2 decimals at each period close. The rounded closing balance feeds the next period.
* A period is one calendar month from the start date. Due date for period *k* = start date + *k* months. If the day does not exist in that month (e.g. Jan 31 → Feb), use the last day of the month.
* Payments dated on or before a period's due date (and after the previous due date) belong to that period.

### 6.2 Interest per period
The engine tracks two buckets: **principal outstanding** and **unpaid interest**.

At each period close:
1. `interest = round(principal_outstanding × r)` where `r = rate / 100`
2. Apply period payments: first to unpaid interest + this period's interest, then to principal.
3. **Compound:** any interest still unpaid is added to principal (capitalized).
   **Simple:** unpaid interest stays in the unpaid interest bucket and does not earn interest.
4. `closing_balance = principal_outstanding + unpaid_interest`

### 6.3 Repayment types
* **Lump sum:** no scheduled payments until maturity. Amount due at maturity = closing balance of the last period.
  * Compound: `A = P(1 + r)^n`
  * Simple: `A = P(1 + r·n)`
* **Equal installments:** `PMT = P·r / (1 − (1 + r)^−n)`, rounded to 2 decimals. The last installment is adjusted so the balance ends at exactly ₱0.00. If `r = 0`, `PMT = P / n`.
* **Custom:** lender enters planned amounts per period. The last period's planned amount is auto-set to clear the balance.

### 6.4 Partial, missed, and early payments
* **Partial or missed installment:** the shortfall stays in the balance. Remaining installments are recalculated over the remaining periods using the PMT formula (re-amortized). The new installment amount is shown on the loan page.
* **Extra payment:** reduces principal. Remaining installments are recalculated the same way.
* **Early payoff (MVP):** full-month interest is charged for the current period. Payoff amount = opening balance + current period interest − payments already made in the period. Prorated interest is Phase 2.

### 6.5 After maturity
* `continue_accruing`: interest keeps accruing monthly at the same rate and method until paid.
* `stop_accruing`: balance freezes at the maturity amount.

### 6.6 Acceptance test cases
The engine must match these to the centavo.

**Case 1 – Lump sum, ₱10,000, 5%/month, 3 months**

| Method | Final balance |
|---|---|
| Compound | ₱11,576.25 |
| Simple | ₱11,500.00 |

**Case 2 – Equal installments, compound, ₱10,000, 5%/month, 3 months**

| Period | Opening | Interest | Payment | Closing |
|---|---|---|---|---|
| 1 | 10,000.00 | 500.00 | 3,672.09 | 6,827.91 |
| 2 | 6,827.91 | 341.40 | 3,672.09 | 3,497.22 |
| 3 | 3,497.22 | 174.86 | 3,672.08 | 0.00 |

Total paid: ₱11,016.26

**Case 3 – Missed payment, compound lump sum.** No payment in period 1 on Case 1 → period 2 opening balance = ₱10,500.00.

More cases (partial payment, overpayment, zero rate, month-end start date) to be added before build.

---

## 7. Data Model (Supabase / Postgres)

All tables have `id uuid pk`, `created_at`, `updated_at`. All user-owned tables have `user_id uuid references auth.users` and Row Level Security: `user_id = auth.uid()` for select, insert, update, delete.

**profiles**
* `id` (= auth user id), `display_name`, `default_grace_days int`, `default_interest_method`, `default_repayment_type`

**borrowers**
* `user_id`, `full_name`, `mobile`, `email`, `address`, `notes`, `archived_at`

**loans**
* `user_id`, `borrower_id`, `principal numeric(14,2)`, `monthly_rate numeric(7,4)`, `tenure_months int`, `start_date date`, `interest_method` (enum), `repayment_type` (enum), `after_maturity` (enum), `grace_days int`, `status` (enum: active, paid, written_off, cancelled), `notes`, `closed_at`

**loan_custom_schedule** (only for custom repayment)
* `loan_id`, `period int`, `planned_amount numeric(14,2)`

**payments**
* `user_id`, `loan_id`, `amount numeric(14,2)`, `paid_on date`, `method` (enum), `reference_no`, `note`, `deleted_at`

**activity_log**
* `user_id`, `entity_type`, `entity_id`, `action` (create/update/delete), `before jsonb`, `after jsonb`
* Written by Postgres triggers, not by app code.

**Indexes:** `loans(user_id, status)`, `payments(loan_id, paid_on)`, `borrowers(user_id)`.

---

## 8. Technical Architecture
* **Framework:** Next.js App Router, TypeScript, Server Components for reads, Server Actions for writes.
* **Supabase client:** `@supabase/ssr`. The service role key is never exposed to the browser.
* **Validation:** Zod schemas shared by forms and Server Actions.
* **Engine:** a pure TypeScript module (`/lib/engine`) — input: loan + payments + as-of date; output: schedule, balances, status. Used on both server (reports) and client (instant previews while typing).
* **Balances are derived, not stored.** The database stores only loan settings and payments. `loans.status = paid` is updated when a payment brings the balance to zero.
* **Reports:** computed server-side by running the engine per loan. Revisit with caching or SQL views if a user has more than ~500 loans.
* **UI:** Tailwind + shadcn/ui, Recharts for charts.
* **Testing:** Vitest for the engine (all cases in 6.6), Playwright for main flows.
* **Hosting:** Vercel (production + preview per branch), Supabase project per environment (dev, prod).
* **Migrations:** Supabase CLI, committed to the repo.

---

## 9. Non-Functional Requirements
* **Accuracy:** matches test cases in 6.6 to the centavo.
* **Responsiveness:** loan form previews update instantly (client-side engine). Pages load in under 2 seconds on 4G.
* **Mobile-first:** most lenders will log payments from a phone.
* **Formatting:** `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`, dates as `MMM d, yyyy`, Asia/Manila timezone.
* **Accessibility:** WCAG 2.2 AA.
* **Security:** RLS on every table, tested. No borrower data in URLs or logs.
* **Privacy (RA 10173):** privacy notice at sign up, data export (CSV of all data), account deletion.
* **Backups:** Supabase daily backups; point-in-time recovery on paid plan.

---

## 10. Legal & Compliance Notes
To be reviewed by a lawyer before launch.
* Show a disclaimer: the app is a record-keeping tool, not legal or financial advice.
* Civil Code Art. 1956: interest must be expressly agreed in writing. Art. 1959: interest on unpaid interest (compounding) needs an express agreement. Consider a checkbox on loan creation: "Interest terms are in a signed written agreement."
* Courts may reduce monthly rates they find unconscionable. Consider a soft warning for high monthly rates.
* Users lending as a business may fall under the Lending Company Regulation Act (SEC registration). Mention in terms of use.

---

## 11. Success Metrics
* 100% of engine test cases pass in CI.
* Zero RLS leaks in security tests (user A can never read user B's data).
* A new user can create a borrower, a loan, and log a payment in under 3 minutes.
* Reported balances match the lender's own records (collected via feedback during beta).

---

## 12. Open Questions
1. Partial installment default: re-amortize remaining installments (current spec) or keep installment fixed and put the shortfall in the last payment? Could be a per-loan setting.
2. Should late payments carry a separate penalty fee or penalty rate, on top of normal interest?
3. Early payoff: is full-month interest acceptable for MVP, or is prorating needed from day one?
4. Should interest-only payment plans (pay interest monthly, principal at maturity) be a fourth repayment type?
