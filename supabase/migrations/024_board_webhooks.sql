-- Block 14: Discord-Webhooks pro Board.
-- Events (card_created, card_moved) werden serverseitig an die URL
-- gepostet. URL ist sensitiv und nur für Editor/Admin des Boards sichtbar.

create table if not exists public.board_webhooks (
  board_id uuid primary key references public.boards(id) on delete cascade,
  discord_url text not null,
  enabled boolean not null default true,
  events text[] not null default array[
    'card_created',
    'card_moved'
  ]::text[],
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.board_webhooks enable row level security;

drop policy if exists "bwh_select" on public.board_webhooks;
create policy "bwh_select" on public.board_webhooks
  for select to authenticated
  using (public.can_edit_board(board_id));

drop policy if exists "bwh_insert" on public.board_webhooks;
create policy "bwh_insert" on public.board_webhooks
  for insert to authenticated
  with check (public.can_edit_board(board_id));

drop policy if exists "bwh_update" on public.board_webhooks;
create policy "bwh_update" on public.board_webhooks
  for update to authenticated
  using (public.can_edit_board(board_id));

drop policy if exists "bwh_delete" on public.board_webhooks;
create policy "bwh_delete" on public.board_webhooks
  for delete to authenticated
  using (public.can_edit_board(board_id));
