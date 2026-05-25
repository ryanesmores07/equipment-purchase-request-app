drop policy "purchase_requests_insert_own_pending" on public.purchase_requests;

create policy "purchase_requests_insert_own_pending"
on public.purchase_requests
for insert
to authenticated
with check (
  applicant_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'employee'
  )
  and status = 'pending'
  and decided_at is null
  and decided_by is null
  and decision_note is null
  and cancelled_at is null
  and cancelled_by is null
  and cancellation_note is null
);
