-- Feedback-Modul: /feedback öffnet Select-Menu (1-5 Sterne), danach optionales Modal mit Kommentar.
-- Fertiges Feedback landet in einem konfigurierbaren Channel — als Embed oder Plain-Text.

alter table public.bot_guilds
  add column if not exists feedback_enabled boolean not null default false,
  add column if not exists feedback_channel_id text,
  add column if not exists feedback_use_embed boolean not null default true,
  add column if not exists feedback_embed_color integer,
  add column if not exists feedback_embed_title text,
  add column if not exists feedback_intro_message text,
  add column if not exists feedback_footer_text text;

create table if not exists public.bot_feedback (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null references public.bot_guilds(guild_id) on delete cascade,
  user_id text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  channel_id text not null,
  message_id text,
  created_at timestamptz not null default now()
);

create index if not exists bot_feedback_guild_created_idx
  on public.bot_feedback (guild_id, created_at desc);

alter table public.bot_feedback enable row level security;
-- Kein RLS-Policy: Bot benutzt Service-Role; Web-App liest über Admin-Client.
