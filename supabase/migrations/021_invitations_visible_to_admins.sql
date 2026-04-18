-- Block 12: workspace-owner/admin eines Boards soll alle Einladungen für
-- dieses Board sehen können (nicht nur die selbst versendeten), damit die
-- "Ausstehende"-Liste im MembersDialog vollständig ist.

drop policy if exists "inv_select" on public.invitations;
create policy "inv_select" on public.invitations
  for select to authenticated
  using (
    invited_by = auth.uid()
    or lower(email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
    or (
      board_id is not null
      and exists (
        select 1
        from public.boards b
        join public.workspace_members wm on wm.workspace_id = b.workspace_id
        where b.id = invitations.board_id
          and wm.user_id = auth.uid()
          and wm.role in ('owner', 'admin')
      )
    )
  );

-- Workspace owner/admin können auch widerrufen (nicht nur der Absender).
drop policy if exists "inv_delete" on public.invitations;
create policy "inv_delete" on public.invitations
  for delete to authenticated
  using (
    invited_by = auth.uid()
    or (
      board_id is not null
      and exists (
        select 1
        from public.boards b
        join public.workspace_members wm on wm.workspace_id = b.workspace_id
        where b.id = invitations.board_id
          and wm.user_id = auth.uid()
          and wm.role in ('owner', 'admin')
      )
    )
  );
