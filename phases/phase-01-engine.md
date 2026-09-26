# Phase 1 — Calculation Engine

**Goal:** A pure TypeScript module in `/lib/engine` that computes schedules, balances, and statuses to the centavo, matching PRD §6.6. This is the core of the product — if the numbers are wrong, nothing else matters.

**Duration:** 5–7 days
**Depends on:** Phase 0
**Blocks:** Phases 3, 4, 5 (any UI that shows numbers)

## Scope

Reference: PRD §6.

### Inputs
```
compute({
  loan: { principal, monthlyRate, tenureMonths, startDate,
          interestMethod, repaymentType, afterMaturity, graceDays,
          customSchedule? },
  payments: Array<{ amount, paidOn }>,
  asOf: Date
})
```

### Outputs
- Full period schedule (opening, interest, scheduled, actual, closing, status).
- Current balance, total paid, interest earned to date.
- Next due date + amount.
- Payoff amount as of `asOf`.
- Overdue flag per period (using `graceDays`).

### Rules to implement (PRD §6.1–6.5)
- `decimal.js` throughout; half-up rounding at each period close.
- Period boundaries: start date + k months, with end-of-month clamp.
- Two-bucket accounting: principal outstanding + unpaid interest.
- Compound vs simple divergence at the "unpaid interest" step.
- Lump sum, equal installments, custom repayment types.
- Zero-rate edge case for equal installments (`PMT = P/n`).
- Re-amortize on partial/missed/extra payments.
- Early payoff = full-month interest for the current period (MVP).
- `after_maturity`: `continue_accruing` vs `stop_accruing`.
- Reject overpayments; return exact payoff amount.

## Deliverables

- `/lib/engine/index.ts` — public API.
- `/lib/engine/*` — internal modules split by concern (period math, allocation, amortization).
- Vitest suite covering:
  - All PRD §6.6 cases to the centavo.
  - Additional cases: partial payment, overpayment rejection, zero rate, month-end start date, missed payment re-amortization, after-maturity behaviors, custom schedule with auto-adjusted last period.

## Acceptance Criteria

- [ ] All PRD §6.6 tables reproduce exactly (centavo-level).
- [ ] Engine is pure: no I/O, no `Date.now()` inside — `asOf` is always passed in.
- [ ] Runs identically in Node (Server Components/Actions) and browser (form preview).
- [ ] Vitest suite passes in CI and blocks merges on failure.

## Open Questions to Resolve Before Coding

- PRD §12 Q1: partial installment default = re-amortize (per spec) vs fixed installment.
- PRD §12 Q3: MVP full-month interest for early payoff confirmed.
- PRD §12 Q4: interest-only repayment type — decide in or out for MVP.

## Risks / Notes

- Freeze `decimal.js` version in `package.json` — a minor bump could shift rounding.
- Do not import any Next.js or Supabase code from `/lib/engine`.
