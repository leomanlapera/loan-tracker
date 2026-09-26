-- Per-user settings. One row per auth.users row, auto-created on signup.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_grace_days integer not null default 0 check (default_grace_days >= 0),
  default_interest_method public.interest_method not null default 'compound',
  default_repayment_type public.repayment_type not null default 'equal_installments',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger tg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.tg_set_updated_at();

-- Auto-create a profile row on new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: user can only touch their own profile row.
alter table public.profiles enable row level security;

create policy profiles_select_self
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_insert_self
  on public.profiles for insert
  with check (id = auth.uid());

create policy profiles_update_self
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_self
  on public.profiles for delete
  using (id = auth.uid());
