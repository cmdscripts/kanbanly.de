-- Block 8: per-card activity log. Each mutation on a card writes one row
-- describing what changed, who did it, and when. Consumed by the card modal
-- activity section.

create table if not exists public.card_activity (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'created',
    'renamed',
    'described',
    'due_set',
    'due_cleared',
    'moved',
    'assignee_added',
    'assignee_removed',
    'label_added',
    'label_removed',
    'task_added',
    'task_done',
    'task_undone',
    'task_deleted'
  )),
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_card_activity_card_created
  on public.card_activity(card_id, created_at desc);

alter table public.card_activity enable row level security;

drop policy if exists "ca_select" on public.card_activity;
create policy "ca_select" on public.card_activity
  for select to authenticated
  using (public.can_view_board(public.card_board_id(card_id)));

drop policy if exists "ca_insert" on public.card_activity;
create policy "ca_insert" on public.card_activity
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_edit_board(public.card_board_id(card_id))
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'card_activity'
  ) then
    alter publication supabase_realtime add table public.card_activity;
  end if;
end
$$;
