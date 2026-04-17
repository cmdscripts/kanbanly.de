-- Phase 2a: Workspaces, workspace_members, boards, board_members.
-- Helper functions (SECURITY DEFINER) keep RLS non-recursive.

-- ============ TABLES ============

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user on public.workspace_members(user_id);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_boards_workspace on public.boards(workspace_id);

create table if not exists public.board_members (
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor', 'admin')),
  added_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create index if not exists idx_board_members_user on public.board_members(user_id);

-- ============ HELPER FUNCTIONS ============
-- SECURITY DEFINER => bypass RLS => safe from infinite recursion in policies.

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(ws uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from workspace_members
  where workspace_id = ws and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_access_board(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from boards
    where id = b and (
      is_workspace_member(workspace_id)
      or exists (
        select 1 from board_members
        where board_id = b and user_id = auth.uid()
      )
    )
  );
$$;

-- ============ AUTO-OWNER TRIGGER ============

create or replace function public.add_workspace_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function add_workspace_owner_member();

-- ============ RLS ============

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;

-- workspaces
drop policy if exists "ws_select" on public.workspaces;
create policy "ws_select" on public.workspaces
  for select using (is_workspace_member(id));

drop policy if exists "ws_insert" on public.workspaces;
create policy "ws_insert" on public.workspaces
  for insert with check (auth.uid() = owner_id);

drop policy if exists "ws_update" on public.workspaces;
create policy "ws_update" on public.workspaces
  for update using (workspace_role(id) in ('owner', 'admin'));

drop policy if exists "ws_delete" on public.workspaces;
create policy "ws_delete" on public.workspaces
  for delete using (workspace_role(id) = 'owner');

-- workspace_members
drop policy if exists "wm_select" on public.workspace_members;
create policy "wm_select" on public.workspace_members
  for select using (is_workspace_member(workspace_id));

drop policy if exists "wm_insert" on public.workspace_members;
create policy "wm_insert" on public.workspace_members
  for insert with check (
    workspace_role(workspace_id) in ('owner', 'admin')
    or user_id = auth.uid()
  );

drop policy if exists "wm_update" on public.workspace_members;
create policy "wm_update" on public.workspace_members
  for update using (workspace_role(workspace_id) in ('owner', 'admin'));

drop policy if exists "wm_delete" on public.workspace_members;
create policy "wm_delete" on public.workspace_members
  for delete using (
    workspace_role(workspace_id) in ('owner', 'admin')
    or user_id = auth.uid()
  );

-- boards
drop policy if exists "b_select" on public.boards;
create policy "b_select" on public.boards
  for select using (can_access_board(id));

drop policy if exists "b_insert" on public.boards;
create policy "b_insert" on public.boards
  for insert with check (is_workspace_member(workspace_id));

drop policy if exists "b_update" on public.boards;
create policy "b_update" on public.boards
  for update using (
    workspace_role(workspace_id) in ('owner', 'admin')
    or exists (
      select 1 from board_members
      where board_id = boards.id and user_id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "b_delete" on public.boards;
create policy "b_delete" on public.boards
  for delete using (workspace_role(workspace_id) in ('owner', 'admin'));

-- board_members
drop policy if exists "bm_select" on public.board_members;
create policy "bm_select" on public.board_members
  for select using (can_access_board(board_id));

drop policy if exists "bm_insert" on public.board_members;
create policy "bm_insert" on public.board_members
  for insert with check (
    exists (
      select 1 from boards
      where id = board_id and (
        workspace_role(workspace_id) in ('owner', 'admin')
        or exists (
          select 1 from board_members bm
          where bm.board_id = boards.id and bm.user_id = auth.uid() and bm.role = 'admin'
        )
      )
    )
  );

drop policy if exists "bm_update" on public.board_members;
create policy "bm_update" on public.board_members
  for update using (
    exists (
      select 1 from boards
      where id = board_id and workspace_role(workspace_id) in ('owner', 'admin')
    )
  );

drop policy if exists "bm_delete" on public.board_members;
create policy "bm_delete" on public.board_members
  for delete using (
    exists (
      select 1 from boards
      where id = board_id and workspace_role(workspace_id) in ('owner', 'admin')
    )
    or user_id = auth.uid()
  );
