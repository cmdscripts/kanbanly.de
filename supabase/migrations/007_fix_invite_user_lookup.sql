-- Replace auth.users lookups with public.profiles to avoid permission issues.

create or replace function public.accept_invitation(t text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invitations%rowtype;
  u_email text;
  resulting_board uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select email into u_email from public.profiles where id = auth.uid();
  if u_email is null then
    raise exception 'profile_missing';
  end if;

  select * into inv
  from invitations
  where token = t
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'invitation_invalid_or_expired';
  end if;

  if lower(inv.email) <> lower(u_email) then
    raise exception 'email_mismatch';
  end if;

  if inv.board_id is not null then
    insert into board_members (board_id, user_id, role)
    values (inv.board_id, auth.uid(), inv.role)
    on conflict (board_id, user_id) do update set role = excluded.role;
    resulting_board := inv.board_id;
  end if;

  update invitations set accepted_at = now() where id = inv.id;

  return resulting_board;
end;
$$;

drop policy if exists "inv_select" on public.invitations;
create policy "inv_select" on public.invitations
  for select to authenticated
  using (
    invited_by = auth.uid()
    or lower(email) = lower(
      coalesce((select email from public.profiles where id = auth.uid()), '')
    )
  );
