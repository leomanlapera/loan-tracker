# Loan Tracker — Project Management Plan

This folder breaks the [PRD](../loan_tracker_prd.md) into executable phases. Each phase file lists scope, deliverables, acceptance criteria, dependencies, and estimated effort.

## Phase Map

| # | Phase | Goal | Est. Duration |
|---|---|---|---|
| 0 | [Foundation & Setup](phase-00-foundation.md) | Repo, tooling, Supabase project, CI, hosting | 3–5 days |
| 1 | [Calculation Engine](phase-01-engine.md) | Pure TS engine matching PRD §6 test cases | 5–7 days |
| 2 | [Auth & Data Model](phase-02-auth-data.md) | Supabase auth, schema, RLS, migrations | 4–6 days |
| 3 | [Borrower & Loan CRUD](phase-03-borrowers-loans.md) | Manage borrowers and loans end-to-end | 5–7 days |
| 4 | [Payments & Loan Detail](phase-04-payments-detail.md) | Payment logging, schedule table, chart | 6–8 days |
| 5 | [Dashboard & Reports](phase-05-dashboard-reports.md) | Dashboard tiles, 6 reports, CSV export | 5–7 days |
| 6 | [Activity Log & Settings](phase-06-activity-settings.md) | Trigger-based audit trail, settings page | 3–4 days |
| 7 | [Polish, QA & Launch](phase-07-launch.md) | Accessibility, mobile, security, legal, beta | 5–7 days |
| 8 | [Phase 2 Backlog](phase-08-post-mvp.md) | Borrower portal, PDFs, reminders, attachments | Post-MVP |

**Total MVP estimate:** ~36–51 working days (7–10 weeks solo, 4–6 weeks with a second dev).

## Execution Rules

- Phases 0–2 are sequential; phases 3–6 can partially overlap once the engine and schema stabilize.
- No phase is "done" until its acceptance criteria are met AND the PRD §6.6 engine cases still pass in CI.
- Every schema change ships as a Supabase migration committed to the repo.
- Every user-owned table must have RLS tested with a two-user fixture before the phase closes.

## Cross-cutting Tracks (run throughout)

- **Testing:** Vitest for engine (blocking), Playwright for main flows (added per phase).
- **Security:** RLS regression test suite grows with every new table.
- **Docs:** Update PRD open questions (§12) as decisions land.
- **Legal:** PRD §10 review scheduled before Phase 7 exits.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Engine rounding drift | Wrong balances shown to lenders | Lock `decimal.js`, freeze §6.6 tests, add property tests |
| RLS misconfiguration | Cross-user data leak | Two-user Playwright + SQL-level tests per table |
| Report perf at scale | Slow dashboard for >500 loans | Server-compute now, revisit caching/SQL views in Phase 5 |
| Legal ambiguity (Art. 1956/1959) | Launch blocker | Lawyer review scheduled inside Phase 7 |
| Scope creep from Phase 2 items | Delayed MVP | Backlog file (phase-08) is the only place they live until MVP ships |

## Open Questions Owned Here

Tracked in PRD §12; each phase owner must resolve any that gate their work before starting.
