-- Allow uppercase letters in usernames.
-- Uniqueness stays case-insensitive (Felix and felix collide) via the
-- existing functional index on lower(username). We just stop normalising
-- the stored casing, so users can present themselves as "Felix".

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-zA-Z0-9_-]{3,20}$');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  insert into public.profiles (id, email, username)
  values (new.id, new.email, v_username)
  on conflict (id) do nothing;

  insert into public.workspaces (name, owner_id)
  values ('My Workspace', new.id);

  return new;
end;
$$;
