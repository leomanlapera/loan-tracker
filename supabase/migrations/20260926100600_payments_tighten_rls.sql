-- Tighten payments RLS: also require the referenced loan belongs to the caller.
-- Without this, a user could insert a payment for their own user_id but point
-- loan_id at another lender's loan. The row would be invisible to the target
-- lender (their read policy only shows rows where user_id = auth.uid()), but
-- it still pollutes data and could be abused.

drop policy if exists payments_insert_self on public.payments;
create policy payments_insert_self
  on public.payments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.loans l
      where l.id = loan_id and l.user_id = auth.uid()
    )
  );

drop policy if exists payments_update_self on public.payments;
create policy payments_update_self
  on public.payments for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.loans l
      where l.id = loan_id and l.user_id = auth.uid()
    )
  );
