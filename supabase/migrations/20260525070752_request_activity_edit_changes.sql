alter table public.request_activity
add column changes jsonb check (changes is null or jsonb_typeof(changes) = 'object');

create or replace function private.tg_write_request_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  edit_changes jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.request_activity(request_id, actor_id, action)
    values (new.id, new.applicant_id, 'created');
    return new;
  end if;

  if old.status = new.status then
    if old.category_id <> new.category_id then
      edit_changes := edit_changes || jsonb_build_object(
        'category_id',
        jsonb_build_object('from', old.category_id, 'to', new.category_id)
      );
    end if;

    if old.title <> new.title then
      edit_changes := edit_changes || jsonb_build_object(
        'title',
        jsonb_build_object('from', old.title, 'to', new.title)
      );
    end if;

    if old.description is distinct from new.description then
      edit_changes := edit_changes || jsonb_build_object(
        'description',
        jsonb_build_object('from', old.description, 'to', new.description)
      );
    end if;

    if old.amount_jpy <> new.amount_jpy then
      edit_changes := edit_changes || jsonb_build_object(
        'amount_jpy',
        jsonb_build_object('from', old.amount_jpy, 'to', new.amount_jpy)
      );
    end if;

    if edit_changes <> '{}'::jsonb then
      insert into public.request_activity(request_id, actor_id, action, changes)
      values (new.id, new.applicant_id, 'edited', edit_changes);
    end if;

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
