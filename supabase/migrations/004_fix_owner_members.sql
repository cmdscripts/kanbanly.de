-- Fix: ensure every workspace owner is present in workspace_members,
-- and recreate the auto-owner trigger idempotently.

-- 1. Backfill missing owner members
insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner'
from public.workspaces
where owner_id is not null
on conflict (workspace_id, user_id) do nothing;

-- 2. Replace trigger function with an idempotent version
create or replace function public.add_workspace_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

-- 3. Ensure trigger is attached
drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.add_workspace_owner_member();
