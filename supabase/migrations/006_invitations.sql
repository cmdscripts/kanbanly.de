-- Phase 2c: Board invitations.
-- Invitee opens /invite/<token>, accepts after (or during) auth, becomes board_member.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  email text not null,
  board_id uuid references public.boards(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor', 'admin')),
  invited_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_email on public.invitations(lower(email));

alter table public.invitations enable row level security;

-- Inviter and the target user (by email) can read
drop policy if exists "inv_select" on public.invitations;
create policy "inv_select" on public.invitations
  for select to authenticated
  using (
    invited_by = auth.uid()
    or lower(email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
  );

-- Only workspace owner/admin (of the board's workspace) can invite
drop policy if exists "inv_insert" on public.invitations;
create policy "inv_insert" on public.invitations
  for insert to authenticated
  with check (
    board_id is not null
    and exists (
      select 1
      from public.boards b
      join public.workspace_members wm on wm.workspace_id = b.workspace_id
      where b.id = invitations.board_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

-- Inviter can revoke
drop policy if exists "inv_delete" on public.invitations;
create policy "inv_delete" on public.invitations
  for delete to authenticated
  using (invited_by = auth.uid());

-- Public lookup by token (returns minimal data, usable pre-auth).
create or replace function public.get_invitation_by_token(t text)
returns table (
  id uuid,
  email text,
  board_id uuid,
  role text,
  board_name text,
  workspace_name text,
  expires_at timestamptz,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.id, i.email, i.board_id, i.role,
    b.name as board_name,
    w.name as workspace_name,
    i.expires_at, i.accepted_at
  from invitations i
  left join boards b on b.id = i.board_id
  left join workspaces w on w.id = b.workspace_id
  where i.token = t
  limit 1;
$$;

grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

-- Accept: validates email match, adds user as board_member, marks invitation used.
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

  select email into u_email from auth.users where id = auth.uid();

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

grant execute on function public.accept_invitation(text) to authenticated;
