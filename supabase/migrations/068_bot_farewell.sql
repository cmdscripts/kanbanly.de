-- Farewell-Messages (Pendant zu Welcome) für Mitglieder, die den Server verlassen.

alter table public.bot_guilds
  add column if not exists farewell_enabled boolean not null default false,
  add column if not exists farewell_channel_id text,
  add column if not exists farewell_message text,
  add column if not exists farewell_use_embed boolean not null default false,
  add column if not exists farewell_embed_color integer;
