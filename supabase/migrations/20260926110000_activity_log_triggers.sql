-- Activity log triggers.
--
-- One SECURITY DEFINER wrapper per attached table. Every trigger:
--   1. Skips when nothing effectively changed (UPDATE-only guard).
--   2. Records the acting user via auth.uid(); falls back to NEW/OLD.user_id
--      when the mutation is performed by the service role (e.g. seeding).
--   3. Writes to activity_log — a table with no INSERT policy for users,
--      so this SECURITY DEFINER function is the only ingress. Users can still
--      read their own rows via the existing SELECT policy.
--
-- Note: loan_custom_schedule doesn't carry user_id; ownership is via loans.
-- Its trigger joins loans to resolve the acting/owning user id.

set search_path = public;

create or replace function public.log_borrower_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid;
  entity uuid;
  before_row jsonb;
  after_row jsonb;
  action_kind public.activity_action;
begin
  if tg_op = 'INSERT' then
    acting_user := coalesce(auth.uid(), new.user_id);
    entity := new.id;
    action_kind := 'create';
    before_row := null;
    after_row := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) = to_jsonb(old) then
      return new;
    end if;
    acting_user := coalesce(auth.uid(), new.user_id, old.user_id);
    entity := new.id;
    action_kind := 'update';
    before_row := to_jsonb(old);
    after_row := to_jsonb(new);
  else
    acting_user := coalesce(auth.uid(), old.user_id);
    entity := old.id;
    action_kind := 'delete';
    before_row := to_jsonb(old);
    after_row := null;
  end if;

  if acting_user is null then
    return coalesce(new, old);
  end if;

  insert into public.activity_log (user_id, entity_type, entity_id, action, before, after)
  values (acting_user, 'borrower', entity, action_kind, before_row, after_row);

  return coalesce(new, old);
end;
$$;

create or replace function public.log_loan_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid;
  entity uuid;
  before_row jsonb;
  after_row jsonb;
  action_kind public.activity_action;
begin
  if tg_op = 'INSERT' then
    acting_user := coalesce(auth.uid(), new.user_id);
    entity := new.id;
    action_kind := 'create';
    before_row := null;
    after_row := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) = to_jsonb(old) then
      return new;
    end if;
    acting_user := coalesce(auth.uid(), new.user_id, old.user_id);
    entity := new.id;
    action_kind := 'update';
    before_row := to_jsonb(old);
    after_row := to_jsonb(new);
  else
    acting_user := coalesce(auth.uid(), old.user_id);
    entity := old.id;
    action_kind := 'delete';
    before_row := to_jsonb(old);
    after_row := null;
  end if;

  if acting_user is null then
    return coalesce(new, old);
  end if;

  insert into public.activity_log (user_id, entity_type, entity_id, action, before, after)
  values (acting_user, 'loan', entity, action_kind, before_row, after_row);

  return coalesce(new, old);
end;
$$;

create or replace function public.log_payment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid;
  entity uuid;
  before_row jsonb;
  after_row jsonb;
  action_kind public.activity_action;
begin
  if tg_op = 'INSERT' then
    acting_user := coalesce(auth.uid(), new.user_id);
    entity := new.id;
    action_kind := 'create';
    before_row := null;
    after_row := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) = to_jsonb(old) then
      return new;
    end if;
    acting_user := coalesce(auth.uid(), new.user_id, old.user_id);
    entity := new.id;
    action_kind := 'update';
    before_row := to_jsonb(old);
    after_row := to_jsonb(new);
  else
    acting_user := coalesce(auth.uid(), old.user_id);
    entity := old.id;
    action_kind := 'delete';
    before_row := to_jsonb(old);
    after_row := null;
  end if;

  if acting_user is null then
    return coalesce(new, old);
  end if;

  insert into public.activity_log (user_id, entity_type, entity_id, action, before, after)
  values (acting_user, 'payment', entity, action_kind, before_row, after_row);

  return coalesce(new, old);
end;
$$;

create or replace function public.log_loan_custom_schedule_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user uuid;
  entity uuid;
  before_row jsonb;
  after_row jsonb;
  action_kind public.activity_action;
  owner_id uuid;
begin
  entity := coalesce(new.loan_id, old.loan_id);
  select user_id into owner_id from public.loans where id = entity;

  if tg_op = 'INSERT' then
    acting_user := coalesce(auth.uid(), owner_id);
    action_kind := 'create';
    before_row := null;
    after_row := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) = to_jsonb(old) then
      return new;
    end if;
    acting_user := coalesce(auth.uid(), owner_id);
    action_kind := 'update';
    before_row := to_jsonb(old);
    after_row := to_jsonb(new);
  else
    acting_user := coalesce(auth.uid(), owner_id);
    action_kind := 'delete';
    before_row := to_jsonb(old);
    after_row := null;
  end if;

  if acting_user is null then
    return coalesce(new, old);
  end if;

  insert into public.activity_log (user_id, entity_type, entity_id, action, before, after)
  values (acting_user, 'loan_custom_schedule', entity, action_kind, before_row, after_row);

  return coalesce(new, old);
end;
$$;

drop trigger if exists tg_borrowers_activity on public.borrowers;
create trigger tg_borrowers_activity
  after insert or update or delete on public.borrowers
  for each row execute procedure public.log_borrower_activity();

drop trigger if exists tg_loans_activity on public.loans;
create trigger tg_loans_activity
  after insert or update or delete on public.loans
  for each row execute procedure public.log_loan_activity();

drop trigger if exists tg_payments_activity on public.payments;
create trigger tg_payments_activity
  after insert or update or delete on public.payments
  for each row execute procedure public.log_payment_activity();

drop trigger if exists tg_loan_custom_schedule_activity on public.loan_custom_schedule;
create trigger tg_loan_custom_schedule_activity
  after insert or update or delete on public.loan_custom_schedule
  for each row execute procedure public.log_loan_custom_schedule_activity();
