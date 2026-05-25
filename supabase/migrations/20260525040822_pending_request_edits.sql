create policy "purchase_requests_employee_update_own_pending"
on public.purchase_requests
for update
to authenticated
using (
  applicant_id = (select auth.uid())
  and status = 'pending'
)
with check (
  applicant_id = (select auth.uid())
  and status = 'pending'
  and decided_at is null
  and decided_by is null
  and decision_note is null
);

grant update(category_id, title, description, amount_jpy)
  on public.purchase_requests to authenticated;

create or replace function public.tg_enforce_purchase_request_update()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'pending' then
    raise exception 'terminal purchase requests cannot be changed';
  end if;

  if new.applicant_id <> old.applicant_id
    or new.requested_at <> old.requested_at then
    raise exception 'purchase request ownership and submitted timestamp cannot be changed';
  end if;

  if old.status = 'pending' and new.status = 'pending' then
    if new.decided_at is not null
      or new.decided_by is not null
      or new.decision_note is not null then
      raise exception 'pending purchase requests cannot include decision data';
    end if;

    return new;
  end if;

  if new.category_id <> old.category_id
    or new.title <> old.title
    or new.description is distinct from old.description
    or new.amount_jpy <> old.amount_jpy then
    raise exception 'purchase request details cannot change during an admin decision';
  end if;

  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    return new;
  end if;

  raise exception 'invalid status transition % to %', old.status, new.status;
end;
$$;
