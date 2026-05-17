-- Goodbye-Messages (Pendant zu Welcome) für Mitglieder, die den Server verlassen.

alter table public.bot_guilds
  add column if not exists goodbye_enabled boolean not null default false,
  add column if not exists goodbye_channel_id text,
  add column if not exists goodbye_message text,
  add column if not exists goodbye_use_embed boolean not null default false,
  add column if not exists goodbye_embed_color integer;
