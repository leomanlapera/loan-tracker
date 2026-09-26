# Phase 6 — Activity Log & Settings

**Goal:** Every mutation is auditable via Postgres triggers, and the lender can customize defaults.

**Duration:** 3–4 days
**Depends on:** Phase 2
**Parallelizable with:** Phases 3–5

## Scope

### Activity Log (PRD §5.8)
- Postgres triggers on `borrowers`, `loans`, `payments`, `loan_custom_schedule` for INSERT / UPDATE / DELETE.
- Trigger writes to `activity_log`: `entity_type`, `entity_id`, `action`, `before jsonb`, `after jsonb`, `user_id = auth.uid()` via `SECURITY DEFINER` wrapper.
- Read-only UI: `/app/(app)/activity/page.tsx` with entity filter and date range.
- Show diff-style before/after for updates.

### Settings (PRD §5.9)
- `/app/(app)/settings/page.tsx`:
  - Display name.
  - Default grace period (days).
  - Default interest method.
  - Default repayment type.
- Currency and timezone shown as read-only ("PHP · Asia/Manila") for MVP.
- Data export: single button generates a ZIP of CSVs (borrowers, loans, payments, activity_log) for RA 10173 portability.

## Deliverables

- Migration adding trigger functions + trigger bindings.
- Activity log page + filter/search.
- Settings page + Server Action.
- Data export Server Action returning a streamed ZIP.

## Acceptance Criteria

- [ ] Any change made via the app appears in the activity log within 1 second.
- [ ] Direct SQL changes are also captured (proves triggers, not app code).
- [ ] Lender can update defaults and see them applied on the next new loan form.
- [ ] Data export ZIP contains all rows the user owns, and only those.

## Risks / Notes

- Triggers must never fail silently — test the SECURITY DEFINER function under RLS to confirm `auth.uid()` is captured correctly.
