-- Auto-create a default workspace for every new signup.
-- Safe to re-run: replaces the existing handle_new_user function.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_ws_id uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.workspaces (name, owner_id)
  values ('My Workspace', new.id)
  returning id into new_ws_id;
  -- on_workspace_created trigger adds the owner as a workspace_member.

  return new;
end;
$$;
