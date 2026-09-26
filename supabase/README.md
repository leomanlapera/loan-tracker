# Supabase — migrations and dev workflow

## First-time setup

The Supabase CLI is not a workspace dep. Install once:

```bash
brew install supabase/tap/supabase        # macOS
# or: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git; scoop install supabase   # Windows
# or: see https://supabase.com/docs/guides/cli
```

Then authenticate and link the remote project:

```bash
supabase login                                       # opens a browser for OAuth
supabase link --project-ref skmwpbkrdsxlhlgsprmq     # links this repo to the dev project
```

## Pushing migrations to the remote dev project

```bash
pnpm db:push          # runs `supabase db push`
```

This applies every SQL file in `supabase/migrations/` in filename order that hasn't already been recorded in the remote `schema_migrations` table. Files are pushed in a single transaction per file.

**Never** hand-edit tables in the Supabase Dashboard. Always change them via a new migration file so the repo stays the source of truth.

## Creating a new migration

Preferred (auto-timestamped):

```bash
supabase migration new short_name
```

Or manually create `supabase/migrations/YYYYMMDDHHMMSS_short_name.sql`. Keep migrations small and focused.

## Running the RLS test suite

After migrations are pushed:

```bash
pnpm test:integration
```

Reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. Creates two throwaway test users (`rls-a-*` and `rls-b-*`), exercises RLS on every user-owned table, then deletes them. Cascade deletes handle the rest of their data.

Do NOT point this at a production project — user creation is real, even if it cleans up after itself.

## Regenerating TypeScript types

```bash
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Not wired to a script yet; do this manually after schema changes.
