-- Borrowers owned by a lender (user_id).

create table public.borrowers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  mobile text,
  email text,
  address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index borrowers_user_id_idx on public.borrowers (user_id);
create index borrowers_user_active_idx on public.borrowers (user_id) where archived_at is null;

create trigger tg_borrowers_updated_at
  before update on public.borrowers
  for each row execute procedure public.tg_set_updated_at();

alter table public.borrowers enable row level security;

create policy borrowers_select_self
  on public.borrowers for select
  using (user_id = auth.uid());

create policy borrowers_insert_self
  on public.borrowers for insert
  with check (user_id = auth.uid());

create policy borrowers_update_self
  on public.borrowers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy borrowers_delete_self
  on public.borrowers for delete
  using (user_id = auth.uid());
