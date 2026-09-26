# Phase 7 — Polish, QA & Launch

**Goal:** Ship the MVP. Cross every non-functional and legal T from PRD §§9–11.

**Duration:** 5–7 days
**Depends on:** All prior phases

## Scope

### Accessibility (PRD §9)
- WCAG 2.2 AA pass on every page: color contrast, focus states, keyboard nav, aria labels on form fields and status chips.
- Axe scan in Playwright for each main flow.

### Mobile & Performance
- Every page tested on 375px width; log payment reachable in ≤2 taps from dashboard.
- Lighthouse: performance ≥90 on 4G throttle for dashboard and loan detail.
- Verify Intl.NumberFormat `en-PH` currency formatting and `MMM d, yyyy` dates across all views.

### Security
- Two-user Playwright + SQL RLS regression suite green.
- No borrower PII in URLs (use IDs only) or in server logs.
- Verify service role key never bundled to client.
- Rate-limit sign-up + password-reset endpoints.

### Legal & Compliance (PRD §10)
- Lawyer review scheduled and signed off. Blocker for prod.
- Privacy notice + terms of use pages linked from sign-up.
- Disclaimer on dashboard footer: "record-keeping tool, not legal or financial advice."
- SEC / Lending Company Regulation Act mention in terms of use.

### Backups & Ops (PRD §9)
- Confirm Supabase daily backups enabled.
- Point-in-time recovery on if paid plan chosen.
- Runbook: restoring a single user's data, rotating keys, handling account deletion requests.

### Beta
- 3–5 real lenders onboard.
- Feedback loop: form + shared inbox.
- Reconcile every reported balance mismatch to engine test cases; add regression cases as needed.

## Deliverables

- Passing Lighthouse + Axe reports checked into `/reports/`.
- Signed legal review note in `/docs/legal-review.md`.
- Runbook in `/docs/ops.md`.
- Beta feedback log + triaged issues.

## Acceptance Criteria (PRD §11)

- [ ] 100% of engine test cases pass in CI.
- [ ] Zero RLS leaks in security tests.
- [ ] New user can create a borrower, a loan, and log a payment in under 3 minutes (timed with 3 beta users).
- [ ] Beta users confirm reported balances match their own records.

## Launch Gate

All acceptance criteria checked + legal sign-off + backup verification = production cutover.
