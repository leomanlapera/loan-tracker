# Ops runbook

Operational procedures for running Loan Tracker in production. Applies to the linked Supabase project (see `supabase/config.toml`) and the Vercel deployment.

## Environments

| Env | Supabase project | Deploys from |
|---|---|---|
| Dev | `skmwpbkrdsxlhlgsprmq` | any branch (preview) |
| Prod | to be created | `main` (Vercel prod) |

Keep dev and prod as separate Supabase projects. Never point prod code at dev, or vice versa.

## Backups

**Supabase daily backups** are on by default for all projects. Retention depends on your plan:
- Free: 7 days
- Pro: 14 days
- Team+: 30 days

**Point-in-Time Recovery (PITR)** — Pro plan and up. Enable it from the Supabase Dashboard → Database → Backups. Required for prod.

Verify at least once per quarter that a backup restores cleanly:

```bash
# 1. Provision a scratch Supabase project.
# 2. Restore the latest backup into it via the dashboard.
# 3. Point a local branch at it:
supabase link --project-ref SCRATCH-PROJECT-REF
pnpm exec supabase db diff  # confirm schema matches
pnpm test:integration        # confirm RLS + triggers still work
```

Delete the scratch project when done.

## Restoring a single user's data

If a user requests a rollback for their own data (deleted a loan by accident, etc.):

1. Find the deletion in `activity_log`:
   ```sql
   select * from public.activity_log
   where user_id = 'THE_USER'
     and action = 'delete'
   order by created_at desc
   limit 20;
   ```
2. The `before` JSON is the row as it was. Re-insert it, adjusting FKs if needed.
3. Log a note in the activity trail by making a plain UPDATE — the trigger will capture it.

## Key rotation

**Supabase service role key** — never in the repo, only in Vercel and `.env.local`.

Rotate every 90 days or immediately on suspected compromise:

1. Supabase Dashboard → Settings → API → Rotate `service_role` key.
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel (Production + Preview + Development scopes).
3. Update `.env.local` on any developer machine.
4. Redeploy the Vercel prod branch.

**Supabase anon key** rotates less often (it's public). Same procedure if compromised.

## Account-deletion requests (RA 10173)

Users can delete their own account from Settings → Danger zone. If a user requests deletion by email:

1. Verify identity (respond from a matching email you have on file).
2. Sign in to Supabase Dashboard → Authentication → Users → find and delete.
3. Cascading FKs remove borrowers, loans, payments, activity_log rows.
4. Backups retain data per the schedule above; confirm this in your reply.

## Migration rollback

Migrations are forward-only in prod. If a migration goes bad:

1. **Don't** `db reset --linked` on prod — it wipes data.
2. Write a new "revert" migration that undoes the change and push it.
3. If the DB is corrupted, restore from the latest backup and replay migrations from that point.

For dev drift (as happened during Phase 2 setup):
```bash
pnpm exec supabase db reset --linked --yes
```
Wipes and re-applies everything. Only ever on dev.

## Rate limits

The auth actions (`signUpAction`, `requestPasswordResetAction`) use an in-memory sliding-window limiter (`src/lib/rate-limit.ts`). It's per-instance — good enough for a single Vercel serverless region.

For multi-region or heavy traffic, swap the backing map for [Upstash Redis](https://upstash.com/docs/redis/features/ratelimiting) — same function signature, replace the `buckets` map with `redis.zadd/zrangebyscore` in `src/lib/rate-limit.ts`.

## Monitoring

Minimum viable:
- Supabase Dashboard → Reports for query volume and errors.
- Vercel Analytics (or Sentry when we add it) for client errors.

Add when we scale:
- Sentry for Server Actions and route handlers.
- A Grafana or Betterstack dashboard for p95 latency on `/dashboard` and `/reports/*`.

## Incident checklist

1. Confirm scope: single user, subset, or everyone?
2. If data loss: freeze writes if possible (Supabase → Auth → disable sign-ins temporarily) and take a fresh backup.
3. If code bug: revert the offending commit on `main`, Vercel auto-deploys within ~2 min.
4. If credential leak: rotate keys immediately (see above).
5. Post-mortem in `docs/incidents/YYYY-MM-DD-summary.md` (create the folder when the first incident happens).
