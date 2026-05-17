-- Onboarding-Tour für das Bot-Dashboard.
-- Pro (guild_id, user_id): ein State-Datensatz + N Progress-Einträge je Step.
-- Mehrere Admins eines Servers laufen die Tour unabhängig durch.

create table if not exists public.bot_onboarding_state (
  guild_id text not null references public.bot_guilds(guild_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'skipped', 'done')),
  current_step text,
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

create table if not exists public.bot_onboarding_progress (
  guild_id text not null references public.bot_guilds(guild_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_key text not null,
  status text not null default 'completed'
    check (status in ('completed', 'skipped')),
  completed_at timestamptz not null default now(),
  primary key (guild_id, user_id, step_key)
);

alter table public.bot_onboarding_state enable row level security;
alter table public.bot_onboarding_progress enable row level security;

-- Jeder authentifizierte User liest/schreibt nur die eigenen Rows.
-- Permission-Check, dass der User den Server überhaupt managen darf, läuft
-- serverseitig in der Server Action (assertCanManage) vor dem Write.
create policy bot_onboarding_state_own_select
  on public.bot_onboarding_state
  for select
  using (auth.uid() = user_id);

create policy bot_onboarding_state_own_modify
  on public.bot_onboarding_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy bot_onboarding_progress_own_select
  on public.bot_onboarding_progress
  for select
  using (auth.uid() = user_id);

create policy bot_onboarding_progress_own_modify
  on public.bot_onboarding_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: updated_at automatisch pflegen
create or replace function public.touch_bot_onboarding_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_bot_onboarding_state_touch on public.bot_onboarding_state;
create trigger trg_bot_onboarding_state_touch
  before update on public.bot_onboarding_state
  for each row execute function public.touch_bot_onboarding_state();
