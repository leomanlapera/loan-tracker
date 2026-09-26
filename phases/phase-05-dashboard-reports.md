# Phase 5 — Dashboard & Reports

**Goal:** Lender opens the app and immediately sees portfolio health. All six PRD reports render with date filters and CSV export.

**Duration:** 5–7 days
**Depends on:** Phases 1, 2, 3, 4
**Blocks:** Phase 7

## Scope

### Dashboard (PRD §5.6)
Tiles / lists:
- Total principal lent (active loans).
- Total outstanding balance.
- Interest earned: this month, this year, all time.
- Collections this month.
- Overdue loans: count + amount.
- Due in the next 7 days list.
- Recent payments list.

All numbers computed server-side by running the engine per loan for the current user.

### Reports (PRD §5.7)
Each with date range filter + CSV download:
- Portfolio summary
- Borrower statement (single borrower deep-dive)
- Collections (grouped by day/week/month AND by method)
- Interest income (per-month interest portion of payments)
- Aging / overdue (1–30, 31–60, 61–90, 90+)
- Write-offs

### Performance
- Compute in parallel per loan (`Promise.all` bounded to CPU count).
- Cache miss OK for MVP; measure with a 500-loan seed.
- If a report exceeds 3s at 500 loans, ticket for SQL view / cache work — do not block MVP.

## Deliverables

- `/app/(app)/dashboard/page.tsx` (Server Component).
- `/app/(app)/reports/{portfolio,statement,collections,interest,aging,write-offs}/page.tsx`.
- Shared CSV export util (RFC 4180, PHP formatting, ISO dates).
- Seed script for 500 loans + assorted payments for perf checks.

## Acceptance Criteria

- [ ] Dashboard loads under 2s at 100 loans on 4G throttle.
- [ ] Every report exports a CSV that round-trips through Excel + Google Sheets.
- [ ] Aging buckets match hand-computed edge cases at bucket boundaries.
- [ ] Interest income report matches sum of engine-allocated interest across payments.
- [ ] All numbers on all pages reconcile to the loan detail page for the same loan.

## Risks / Notes

- Interest income = interest portion of payments *received* in the period, not accrued. Clarify with the engine team before implementing.
