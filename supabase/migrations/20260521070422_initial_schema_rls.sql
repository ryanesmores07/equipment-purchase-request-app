create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('employee', 'admin')),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (name, sort_order) values
  ('オフィス備品', 10),
  ('PC・周辺機器', 20),
  ('ソフトウェアライセンス', 30),
  ('書籍・学習', 40),
  ('その他', 99)
on conflict (name) do nothing;

create table public.purchase_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id),
  category_id uuid not null references public.categories(id),
  title text not null check (length(title) between 1 and 120),
  description text check (description is null or length(description) <= 1000),
  amount_jpy integer not null check (amount_jpy > 0 and amount_jpy <= 10000000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  constraint purchase_requests_decision_state_check check (
    (
      status = 'pending'
      and decided_at is null
      and decided_by is null
      and decision_note is null
    )
    or (
      status = 'approved'
      and decided_at is not null
      and decided_by is not null
    )
    or (
      status = 'rejected'
      and decided_at is not null
      and decided_by is not null
      and nullif(btrim(decision_note), '') is not null
    )
  )
);

create index purchase_requests_applicant_requested_at_idx
  on public.purchase_requests(applicant_id, requested_at desc);

create index purchase_requests_status_requested_at_idx
  on public.purchase_requests(status, requested_at desc);

create table public.approval_history (
  id uuid primary key default extensions.gen_random_uuid(),
  request_id uuid not null references public.purchase_requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  from_status text not null check (from_status in ('pending', 'approved', 'rejected')),
  to_status text not null check (to_status in ('pending', 'approved', 'rejected')),
  note text check (note is null or length(note) <= 500),
  acted_at timestamptz not null default now()
);

create index approval_history_request_acted_at_idx
  on public.approval_history(request_id, acted_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.tg_handle_new_user()
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

create trigger tg_handle_new_user
after insert on auth.users
for each row execute function public.tg_handle_new_user();

create or replace function public.tg_enforce_purchase_request_update()
returns trigger
language plpgsql
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

create trigger tg_enforce_purchase_request_update
before update on public.purchase_requests
for each row execute function public.tg_enforce_purchase_request_update();

create or replace function public.tg_write_approval_history()
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

create trigger tg_write_approval_history
after update of status on public.purchase_requests
for each row execute function public.tg_write_approval_history();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.approval_history enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "categories_select_authenticated"
on public.categories
for select
to authenticated
using (true);

create policy "purchase_requests_select_own_or_admin"
on public.purchase_requests
for select
to authenticated
using (applicant_id = auth.uid() or public.is_admin());

create policy "purchase_requests_insert_own_pending"
on public.purchase_requests
for insert
to authenticated
with check (
  applicant_id = auth.uid()
  and status = 'pending'
  and decided_at is null
  and decided_by is null
  and decision_note is null
);

create policy "purchase_requests_admin_decide"
on public.purchase_requests
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('approved', 'rejected')
  and decided_at is not null
  and decided_by = auth.uid()
);

create policy "approval_history_select_visible_requests"
on public.approval_history
for select
to authenticated
using (
  exists (
    select 1
    from public.purchase_requests pr
    where pr.id = approval_history.request_id
  )
);

revoke all on public.profiles from anon, authenticated;
revoke all on public.categories from anon, authenticated;
revoke all on public.purchase_requests from anon, authenticated;
revoke all on public.approval_history from anon, authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.categories to authenticated;
grant select, insert on public.purchase_requests to authenticated;
grant update(status, decided_at, decided_by, decision_note)
  on public.purchase_requests to authenticated;
grant select on public.approval_history to authenticated;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.tg_handle_new_user() from public;
revoke execute on function public.tg_enforce_purchase_request_update() from public;
revoke execute on function public.tg_write_approval_history() from public;
