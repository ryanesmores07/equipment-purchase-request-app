create table public.request_activity (
  id uuid primary key default extensions.gen_random_uuid(),
  request_id uuid not null references public.purchase_requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null check (action in ('created', 'edited', 'cancelled', 'approved', 'rejected')),
  note text check (note is null or length(note) <= 500),
  acted_at timestamptz not null default now()
);

create index request_activity_request_acted_at_idx
  on public.request_activity(request_id, acted_at desc);

create index request_activity_actor_id_idx
  on public.request_activity(actor_id);

alter table public.request_activity enable row level security;

create policy "request_activity_select_visible_requests"
on public.request_activity
for select
to authenticated
using (
  exists (
    select 1
    from public.purchase_requests pr
    where pr.id = request_activity.request_id
  )
);

revoke all on public.request_activity from anon, authenticated;
grant select on public.request_activity to authenticated;

insert into public.request_activity(request_id, actor_id, action, acted_at)
select id, applicant_id, 'created', requested_at
from public.purchase_requests;

insert into public.request_activity(request_id, actor_id, action, note, acted_at)
select id, decided_by, status, decision_note, decided_at
from public.purchase_requests
where status in ('approved', 'rejected')
  and decided_by is not null
  and decided_at is not null;

insert into public.request_activity(request_id, actor_id, action, note, acted_at)
select id, cancelled_by, 'cancelled', cancellation_note, cancelled_at
from public.purchase_requests
where status = 'cancelled'
  and cancelled_by is not null
  and cancelled_at is not null;

create or replace function private.tg_write_request_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_activity(request_id, actor_id, action)
    values (new.id, new.applicant_id, 'created');
    return new;
  end if;

  if old.status = new.status
    and (
      old.category_id <> new.category_id
      or old.title <> new.title
      or old.description is distinct from new.description
      or old.amount_jpy <> new.amount_jpy
    ) then
    insert into public.request_activity(request_id, actor_id, action)
    values (new.id, new.applicant_id, 'edited');
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.request_activity(request_id, actor_id, action, note)
    values (
      new.id,
      coalesce(new.decided_by, new.cancelled_by),
      case
        when new.status = 'approved' then 'approved'
        when new.status = 'rejected' then 'rejected'
        when new.status = 'cancelled' then 'cancelled'
      end,
      coalesce(new.decision_note, new.cancellation_note)
    );
  end if;

  return new;
end;
$$;

create trigger tg_write_request_activity
after insert or update on public.purchase_requests
for each row execute function private.tg_write_request_activity();

grant execute on function private.tg_write_request_activity() to postgres;
