# Phase 0 — Foundation & Setup

**Goal:** Stand up the repo, tooling, and hosting so every later phase can ship code the same day it's written.

**Duration:** 3–5 days
**Depends on:** Nothing
**Blocks:** All later phases

## Scope

- Next.js 15 App Router project with TypeScript, ESLint, Prettier.
- Tailwind + shadcn/ui installed, base theme configured (mobile-first).
- Supabase projects created: `loan-tracker-dev`, `loan-tracker-prod`.
- Supabase CLI wired; empty `supabase/migrations` folder committed.
- Vercel project linked; preview deployment per branch, prod on `main`.
- Environment variables documented in `.env.example` (no secrets committed).
- Vitest + Playwright configured with sample tests passing in CI.
- GitHub Actions: lint, typecheck, unit tests, Playwright smoke on PRs.
- `decimal.js`, `zod`, `@supabase/ssr`, `recharts` installed.

## Deliverables

- Green CI on `main` with one placeholder page and one Vitest.
- Vercel preview URL working for a new branch.
- `README.md` with local setup instructions (Node version, env vars, Supabase link, commands).

## Acceptance Criteria

- [ ] `pnpm dev` runs locally with Supabase connection.
- [ ] Pushing a branch produces a Vercel preview.
- [ ] CI blocks merges on failing lint/typecheck/test.
- [ ] `supabase db reset` runs cleanly against a fresh local db.

## Risks / Notes

- Pick pnpm vs npm now; document the choice.
- Confirm Node version pinned via `.nvmrc` matches Vercel runtime.
