# Phase 4 — Payments & Loan Detail Page

**Goal:** Lender can log payments (with soft edits/deletes) and see the full loan story — summary, schedule, chart, and payment log — on one page.

**Duration:** 6–8 days
**Depends on:** Phases 1, 2, 3
**Blocks:** Phase 5

## Scope

### Payments (PRD §5.4)
- Log payment form: amount (req), date paid (req, not future), method enum, reference, note.
- Server-side allocation: interest first, then principal (delegated to engine).
- Reject overpayments; response includes exact payoff amount for the date.
- "Pay off loan" shortcut fills in engine-computed payoff amount for today.
- Soft edit and soft delete (`deleted_at`). Deleted payments hidden by default; toggle to show history.
- On any payment change, recompute status; set `loans.status = paid` when balance hits ₱0.

### Loan Detail Page (PRD §5.5)
Layout for mobile-first, expands on desktop:
- **Summary card:** principal, rate, method, start date, maturity date, current balance, total paid, interest earned, next due date + amount.
- **Schedule table:** period #, due date, opening, interest, scheduled, actual, closing, status chip (`paid` / `partial` / `unpaid` / `upcoming`).
- **Payment log:** list with edit/delete, shows soft-deleted with a toggle.
- **Chart (Recharts):** balance over time, compound vs simple lines using the same payment set.

### Actions available on the page
- Log payment
- Pay off loan
- Edit loan (respects Phase 3 gating)
- Change status: mark written-off, cancel, reopen
- Archive / close

## Deliverables

- `/app/(app)/loans/[id]/page.tsx` + subcomponents.
- Payment Server Actions + Zod schemas.
- Chart component with responsive sizing.

## Acceptance Criteria

- [ ] Logging a payment updates balance, schedule, and status atomically.
- [ ] Overpayment attempt returns the exact payoff amount in the error.
- [ ] Payoff shortcut brings balance to exactly ₱0.00.
- [ ] Soft-deleted payments do not affect balances but appear in history view.
- [ ] Schedule table matches engine output for all §6.6 cases.
- [ ] Chart renders without layout shift on mobile.

## Risks / Notes

- Concurrent payment writes: wrap allocation + status update in a single Server Action; consider a SELECT ... FOR UPDATE if contention appears.
