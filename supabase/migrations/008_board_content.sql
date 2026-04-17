-- Phase 2d: lists, cards, tasks + RLS + default lists trigger.

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_lists_board on public.lists(board_id, position);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null,
  description text,
  position integer not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cards_list on public.cards(list_id, position);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_tasks_card on public.tasks(card_id, position);

-- ============ HELPERS ============

create or replace function public.can_view_board(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.boards bd
    join public.workspace_members wm on wm.workspace_id = bd.workspace_id
    where bd.id = b and wm.user_id = auth.uid()
  )
  or exists (
    select 1 from public.board_members bm
    where bm.board_id = b and bm.user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_board(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.boards bd
    join public.workspace_members wm on wm.workspace_id = bd.workspace_id
    where bd.id = b and wm.user_id = auth.uid()
  )
  or exists (
    select 1 from public.board_members bm
    where bm.board_id = b
      and bm.user_id = auth.uid()
      and bm.role in ('editor', 'admin')
  );
$$;

create or replace function public.list_board_id(lid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select board_id from public.lists where id = lid;
$$;

create or replace function public.card_board_id(cid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select l.board_id from public.cards c
  join public.lists l on l.id = c.list_id
  where c.id = cid;
$$;

-- ============ DEFAULT LISTS TRIGGER ============

create or replace function public.add_default_lists()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into lists (board_id, title, position) values
    (new.id, 'To Do', 0),
    (new.id, 'In Progress', 1),
    (new.id, 'Done', 2);
  return new;
end;
$$;

drop trigger if exists on_board_created on public.boards;
create trigger on_board_created
  after insert on public.boards
  for each row execute function public.add_default_lists();

-- ============ RLS ============

alter table public.lists enable row level security;
alter table public.cards enable row level security;
alter table public.tasks enable row level security;

-- lists
drop policy if exists "l_select" on public.lists;
create policy "l_select" on public.lists
  for select to authenticated using (public.can_view_board(board_id));

drop policy if exists "l_insert" on public.lists;
create policy "l_insert" on public.lists
  for insert to authenticated with check (public.can_edit_board(board_id));

drop policy if exists "l_update" on public.lists;
create policy "l_update" on public.lists
  for update to authenticated using (public.can_edit_board(board_id));

drop policy if exists "l_delete" on public.lists;
create policy "l_delete" on public.lists
  for delete to authenticated using (public.can_edit_board(board_id));

-- cards
drop policy if exists "c_select" on public.cards;
create policy "c_select" on public.cards
  for select to authenticated using (public.can_view_board(public.list_board_id(list_id)));

drop policy if exists "c_insert" on public.cards;
create policy "c_insert" on public.cards
  for insert to authenticated with check (public.can_edit_board(public.list_board_id(list_id)));

drop policy if exists "c_update" on public.cards;
create policy "c_update" on public.cards
  for update to authenticated using (public.can_edit_board(public.list_board_id(list_id)));

drop policy if exists "c_delete" on public.cards;
create policy "c_delete" on public.cards
  for delete to authenticated using (public.can_edit_board(public.list_board_id(list_id)));

-- tasks
drop policy if exists "t_select" on public.tasks;
create policy "t_select" on public.tasks
  for select to authenticated using (public.can_view_board(public.card_board_id(card_id)));

drop policy if exists "t_insert" on public.tasks;
create policy "t_insert" on public.tasks
  for insert to authenticated with check (public.can_edit_board(public.card_board_id(card_id)));

drop policy if exists "t_update" on public.tasks;
create policy "t_update" on public.tasks
  for update to authenticated using (public.can_edit_board(public.card_board_id(card_id)));

drop policy if exists "t_delete" on public.tasks;
create policy "t_delete" on public.tasks
  for delete to authenticated using (public.can_edit_board(public.card_board_id(card_id)));
