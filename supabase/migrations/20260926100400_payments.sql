-- Payments log. Soft delete via deleted_at so history is preserved.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  paid_on date not null,
  method public.payment_method not null default 'cash',
  reference_no text,
  note text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index payments_loan_paid_on_idx on public.payments (loan_id, paid_on);
create index payments_loan_active_idx on public.payments (loan_id) where deleted_at is null;
create index payments_user_paid_on_idx on public.payments (user_id, paid_on);

create trigger tg_payments_updated_at
  before update on public.payments
  for each row execute procedure public.tg_set_updated_at();

alter table public.payments enable row level security;

create policy payments_select_self
  on public.payments for select
  using (user_id = auth.uid());

create policy payments_insert_self
  on public.payments for insert
  with check (user_id = auth.uid());

create policy payments_update_self
  on public.payments for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy payments_delete_self
  on public.payments for delete
  using (user_id = auth.uid());
