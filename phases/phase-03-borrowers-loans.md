# Phase 3 — Borrower & Loan CRUD

**Goal:** Lender can create, edit, archive borrowers, and create/edit/close/archive loans with live preview powered by the Phase 1 engine.

**Duration:** 5–7 days
**Depends on:** Phases 1, 2
**Blocks:** Phase 4

## Scope

### Borrowers (PRD §5.2)
- List view with search, total outstanding (from engine), active loan count.
- Create/edit form: name (req), mobile, email, address, notes.
- Archive action; delete blocked if active loans exist.

### Loans (PRD §5.3)
- Create form fields per PRD §5.3 table.
- Zod schemas shared between form and Server Action.
- Client-side engine preview: as the lender types principal / rate / tenure / method / repayment type, show the schedule preview instantly.
- Edit rules:
  - Principal, rate, start date, method: editable only if no payments exist. Otherwise gated by confirmation + activity log entry (log itself lands in Phase 6, but the confirmation UX ships now).
- Status transitions: `active`, `paid` (auto), `written_off`, `cancelled`. `overdue` is derived, never stored.
- Custom repayment: sub-form for `loan_custom_schedule` rows; last period auto-adjusted.

### Compliance touch (PRD §10)
- Checkbox on loan creation: "Interest terms are in a signed written agreement."
- Soft warning when monthly rate exceeds a configurable threshold (default 6%).

## Deliverables

- `/app/(app)/borrowers/{page,new,[id]}` routes.
- `/app/(app)/loans/{page,new,[id]/edit}` routes.
- Server Actions for all mutations, all validated with Zod.
- Live-preview component using the engine on the client.

## Acceptance Criteria

- [ ] Full CRUD works for borrowers and loans against RLS-protected tables.
- [ ] Live preview matches server-computed schedule for the same inputs.
- [ ] Archived borrowers hidden from selectors but visible in a filter.
- [ ] Attempting to delete a borrower with active loans returns a clear error.
- [ ] "Interest terms in writing" checkbox is required to create a loan.

## Open Questions

- PRD §12 Q2: separate penalty rate for late payments — decide before finalizing the loan form. Recommend deferring to Phase 2.
