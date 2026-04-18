-- Block 9: comments per card. Short-form discussion anchored to a card,
-- consumed in the card modal with realtime updates.

create table if not exists public.card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_card_comments_card_created
  on public.card_comments(card_id, created_at desc);

alter table public.card_comments enable row level security;

drop policy if exists "cc_select" on public.card_comments;
create policy "cc_select" on public.card_comments
  for select to authenticated
  using (public.can_view_board(public.card_board_id(card_id)));

drop policy if exists "cc_insert" on public.card_comments;
create policy "cc_insert" on public.card_comments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_edit_board(public.card_board_id(card_id))
  );

drop policy if exists "cc_update" on public.card_comments;
create policy "cc_update" on public.card_comments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "cc_delete" on public.card_comments;
create policy "cc_delete" on public.card_comments
  for delete to authenticated
  using (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'card_comments'
  ) then
    alter publication supabase_realtime add table public.card_comments;
  end if;
end
$$;
