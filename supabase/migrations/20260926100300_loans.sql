-- Loans and their optional custom-repayment schedule.

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  borrower_id uuid not null references public.borrowers(id) on delete restrict,
  principal numeric(14, 2) not null check (principal > 0),
  monthly_rate numeric(7, 4) not null check (monthly_rate >= 0 and monthly_rate <= 100),
  tenure_months integer not null check (tenure_months between 1 and 120),
  start_date date not null,
  interest_method public.interest_method not null default 'compound',
  repayment_type public.repayment_type not null default 'equal_installments',
  after_maturity public.after_maturity not null default 'continue_accruing',
  grace_days integer not null default 0 check (grace_days >= 0),
  status public.loan_status not null default 'active',
  agreement_in_writing boolean not null default false,
  notes text,
  reference_no text,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index loans_user_status_idx on public.loans (user_id, status);
create index loans_borrower_idx on public.loans (borrower_id);

create trigger tg_loans_updated_at
  before update on public.loans
  for each row execute procedure public.tg_set_updated_at();

alter table public.loans enable row level security;

create policy loans_select_self
  on public.loans for select
  using (user_id = auth.uid());

create policy loans_insert_self
  on public.loans for insert
  with check (user_id = auth.uid());

create policy loans_update_self
  on public.loans for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy loans_delete_self
  on public.loans for delete
  using (user_id = auth.uid());

-- Custom repayment schedule (only used when loans.repayment_type = 'custom').
create table public.loan_custom_schedule (
  loan_id uuid not null references public.loans(id) on delete cascade,
  period integer not null check (period >= 1),
  planned_amount numeric(14, 2) not null check (planned_amount >= 0),
  primary key (loan_id, period)
);

alter table public.loan_custom_schedule enable row level security;

-- No direct user_id column; ownership is inherited via the parent loan.
create policy loan_custom_schedule_select_self
  on public.loan_custom_schedule for select
  using (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()));

create policy loan_custom_schedule_insert_self
  on public.loan_custom_schedule for insert
  with check (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()));

create policy loan_custom_schedule_update_self
  on public.loan_custom_schedule for update
  using (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()));

create policy loan_custom_schedule_delete_self
  on public.loan_custom_schedule for delete
  using (exists (select 1 from public.loans l where l.id = loan_id and l.user_id = auth.uid()));
