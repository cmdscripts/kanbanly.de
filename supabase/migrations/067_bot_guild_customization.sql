-- Bot-Customization pro Guild: eigener Nickname + eigener Server-Avatar.
-- Discord-Endpoint: PATCH /guilds/{guild.id}/members/@me

create table if not exists public.bot_guild_customization (
  guild_id text primary key references public.bot_guilds(guild_id) on delete cascade,
  nickname text check (nickname is null or char_length(nickname) <= 32),
  avatar_url text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.bot_guild_customization enable row level security;

-- Service-Role (Bot) hat sowieso vollen Zugriff via createAdminClient — keine Policy nötig.
-- Web-App schreibt ausschließlich über Server Actions mit assertCanManage(), also
-- ist eine permissive Policy für authentifizierte User OK; die Permission-Prüfung
-- läuft serverseitig vor jedem Write. Trotzdem hier defensiv: kein direkter Client-Write.
create policy bot_guild_customization_select_own
  on public.bot_guild_customization
  for select
  using (auth.role() = 'authenticated');

-- Trigger: updated_at automatisch pflegen
create or replace function public.touch_bot_guild_customization()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_bot_guild_customization_touch on public.bot_guild_customization;
create trigger trg_bot_guild_customization_touch
  before update on public.bot_guild_customization
  for each row execute function public.touch_bot_guild_customization();

-- Realtime: damit der Bot via postgres_changes auf Updates reagieren kann
alter publication supabase_realtime add table public.bot_guild_customization;
