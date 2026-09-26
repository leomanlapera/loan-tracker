-- Enums and shared helpers for the loan tracker schema.

create type public.interest_method as enum ('compound', 'simple');
create type public.repayment_type as enum ('lump_sum', 'equal_installments', 'custom');
create type public.after_maturity as enum ('continue_accruing', 'stop_accruing');
create type public.loan_status as enum ('active', 'paid', 'written_off', 'cancelled');
create type public.payment_method as enum ('cash', 'gcash', 'maya', 'bank_transfer', 'check', 'other');
create type public.activity_action as enum ('create', 'update', 'delete');
create type public.activity_entity as enum ('borrower', 'loan', 'payment', 'loan_custom_schedule');

-- updated_at auto-bump trigger function. Attach to every table with updated_at.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;
