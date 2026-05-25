alter table public.purchase_requests
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles(id),
  add column cancellation_note text check (cancellation_note is null or length(cancellation_note) <= 500);

create index purchase_requests_cancelled_by_idx
  on public.purchase_requests(cancelled_by);

alter table public.purchase_requests
  drop constraint if exists purchase_requests_status_check,
  add constraint purchase_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled'));

alter table public.approval_history
  drop constraint if exists approval_history_from_status_check,
  add constraint approval_history_from_status_check
    check (from_status in ('pending', 'approved', 'rejected', 'cancelled'));

alter table public.approval_history
  drop constraint if exists approval_history_to_status_check,
  add constraint approval_history_to_status_check
    check (to_status in ('pending', 'approved', 'rejected', 'cancelled'));

alter table public.purchase_requests
  drop constraint if exists purchase_requests_decision_state_check,
  add constraint purchase_requests_decision_state_check check (
    (
      status = 'pending'
      and decided_at is null
      and decided_by is null
      and decision_note is null
      and cancelled_at is null
      and cancelled_by is null
      and cancellation_note is null
    )
    or (
      status = 'approved'
      and decided_at is not null
      and decided_by is not null
      and cancelled_at is null
      and cancelled_by is null
      and cancellation_note is null
    )
    or (
      status = 'rejected'
      and decided_at is not null
      and decided_by is not null
      and nullif(btrim(decision_note), '') is not null
      and cancelled_at is null
      and cancelled_by is null
      and cancellation_note is null
    )
    or (
      status = 'cancelled'
      and decided_at is null
      and decided_by is null
      and decision_note is null
      and cancelled_at is not null
      and cancelled_by = applicant_id
    )
  );

drop policy "purchase_requests_insert_own_pending" on public.purchase_requests;
create policy "purchase_requests_insert_own_pending"
on public.purchase_requests
for insert
to authenticated
with check (
  applicant_id = (select auth.uid())
  and status = 'pending'
  and decided_at is null
  and decided_by is null
  and decision_note is null
  and cancelled_at is null
  and cancelled_by is null
  and cancellation_note is null
);

create policy "purchase_requests_employee_cancel_own_pending"
on public.purchase_requests
for update
to authenticated
using (
  applicant_id = (select auth.uid())
  and status = 'pending'
)
with check (
  applicant_id = (select auth.uid())
  and status = 'cancelled'
  and decided_at is null
  and decided_by is null
  and decision_note is null
  and cancelled_at is not null
  and cancelled_by = (select auth.uid())
);

grant update(status, cancelled_at, cancelled_by, cancellation_note)
  on public.purchase_requests to authenticated;

create or replace function public.tg_enforce_purchase_request_update()
returns trigger
language plpgsql
set search_path = public
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
      or new.decision_note is not null
      or new.cancelled_at is not null
      or new.cancelled_by is not null
      or new.cancellation_note is not null then
      raise exception 'pending purchase requests cannot include decision or cancellation data';
    end if;

    return new;
  end if;

  if new.category_id <> old.category_id
    or new.title <> old.title
    or new.description is distinct from old.description
    or new.amount_jpy <> old.amount_jpy then
    raise exception 'purchase request details cannot change during a terminal transition';
  end if;

  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    if new.cancelled_at is not null
      or new.cancelled_by is not null
      or new.cancellation_note is not null then
      raise exception 'admin decisions cannot include cancellation data';
    end if;

    return new;
  end if;

  if old.status = 'pending' and new.status = 'cancelled' then
    if new.decided_at is not null
      or new.decided_by is not null
      or new.decision_note is not null then
      raise exception 'cancelled requests cannot include decision data';
    end if;

    return new;
  end if;

  raise exception 'invalid status transition % to %', old.status, new.status;
end;
$$;

create or replace function private.tg_write_approval_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.approval_history(
      request_id,
      actor_id,
      from_status,
      to_status,
      note
    )
    values (
      new.id,
      coalesce(new.decided_by, new.cancelled_by),
      old.status,
      new.status,
      coalesce(new.decision_note, new.cancellation_note)
    );
  end if;

  return new;
end;
$$;
