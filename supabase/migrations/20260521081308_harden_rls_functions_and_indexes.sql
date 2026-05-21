create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_full_name text;
begin
  v_email := coalesce(new.email, new.raw_user_meta_data->>'email');
  v_full_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(v_email, '@', 1),
    'Employee'
  );

  insert into public.profiles(id, email, full_name, role)
  values (new.id, v_email, v_full_name, 'employee')
  on conflict (id) do nothing;

  return new;
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
      new.decided_by,
      old.status,
      new.status,
      new.decision_note
    );
  end if;

  return new;
end;
$$;

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
    or new.category_id <> old.category_id
    or new.title <> old.title
    or new.description is distinct from old.description
    or new.amount_jpy <> old.amount_jpy
    or new.requested_at <> old.requested_at then
    raise exception 'purchase request details cannot be changed after creation';
  end if;

  if old.status = new.status then
    raise exception 'purchase request updates must change status';
  end if;

  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    return new;
  end if;

  raise exception 'invalid status transition % to %', old.status, new.status;
end;
$$;

drop policy "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or private.is_admin());

drop policy "purchase_requests_select_own_or_admin" on public.purchase_requests;
create policy "purchase_requests_select_own_or_admin"
on public.purchase_requests
for select
to authenticated
using (applicant_id = (select auth.uid()) or private.is_admin());

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
);

drop policy "purchase_requests_admin_decide" on public.purchase_requests;
create policy "purchase_requests_admin_decide"
on public.purchase_requests
for update
to authenticated
using (private.is_admin())
with check (
  private.is_admin()
  and status in ('approved', 'rejected')
  and decided_at is not null
  and decided_by = (select auth.uid())
);

drop trigger tg_handle_new_user on auth.users;
create trigger tg_handle_new_user
after insert on auth.users
for each row execute function private.tg_handle_new_user();

drop trigger tg_write_approval_history on public.purchase_requests;
create trigger tg_write_approval_history
after update of status on public.purchase_requests
for each row execute function private.tg_write_approval_history();

create index purchase_requests_category_id_idx
  on public.purchase_requests(category_id);

create index purchase_requests_decided_by_idx
  on public.purchase_requests(decided_by);

create index approval_history_actor_id_idx
  on public.approval_history(actor_id);

revoke all on schema private from public;
revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.tg_handle_new_user() to postgres;
grant execute on function private.tg_write_approval_history() to postgres;

drop function public.is_admin();
drop function public.tg_handle_new_user();
drop function public.tg_write_approval_history();
