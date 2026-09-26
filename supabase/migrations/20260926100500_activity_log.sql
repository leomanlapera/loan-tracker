-- Immutable audit trail. Triggers that write to this table land in Phase 6.

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type public.activity_entity not null,
  entity_id uuid not null,
  action public.activity_action not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index activity_log_user_created_idx on public.activity_log (user_id, created_at desc);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);

alter table public.activity_log enable row level security;

-- Read-only for users: they can see their own log entries, nothing else.
create policy activity_log_select_self
  on public.activity_log for select
  using (user_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies: only triggers (SECURITY DEFINER) may write.
