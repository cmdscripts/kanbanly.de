-- Bulletproof fix: use direct SQL in RLS, no helper function indirection.
-- Also re-runs the owner backfill to be safe.

-- 1. Backfill owner memberships again (idempotent)
insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner'
from public.workspaces
where owner_id is not null
on conflict (workspace_id, user_id) do nothing;

-- 2. Rewrite board RLS without helper functions
drop policy if exists "b_select" on public.boards;
create policy "b_select" on public.boards
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = boards.workspace_id
        and wm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.board_members bm
      where bm.board_id = boards.id
        and bm.user_id = auth.uid()
    )
  );

drop policy if exists "b_insert" on public.boards;
create policy "b_insert" on public.boards
  for insert to authenticated
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = boards.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "b_update" on public.boards;
create policy "b_update" on public.boards
  for update to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = boards.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.board_members bm
      where bm.board_id = boards.id
        and bm.user_id = auth.uid()
        and bm.role = 'admin'
    )
  );

drop policy if exists "b_delete" on public.boards;
create policy "b_delete" on public.boards
  for delete to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = boards.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );
