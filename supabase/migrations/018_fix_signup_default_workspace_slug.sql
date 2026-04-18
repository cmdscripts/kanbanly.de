-- Regression fix: the auto-created "My Workspace" on signup didn't set a
-- slug, which has been NOT NULL since migration 014. Every new signup has
-- been failing with "Database error saving new user".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_ws_name text := 'My Workspace';
  v_base text;
  v_slug text;
begin
  v_username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  insert into public.profiles (id, email, username)
  values (new.id, new.email, v_username)
  on conflict (id) do nothing;

  v_base := coalesce(public.slugify(v_ws_name), 'workspace');
  v_slug := v_base || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.workspaces (name, slug, owner_id)
  values (v_ws_name, v_slug, new.id);

  return new;
end;
$$;
