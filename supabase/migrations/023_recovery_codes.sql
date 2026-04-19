-- Block 13: Recovery-Codes statt E-Mail-basiertem Passwort-Reset.
-- Bei Signup werden 8 Codes erzeugt und nur deren SHA-256-Hash gespeichert.
-- Zum Reset tauscht der User (email, code, neues Passwort).

create table if not exists public.recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_recovery_codes_user
  on public.recovery_codes(user_id, used_at);

create index if not exists idx_recovery_codes_hash
  on public.recovery_codes(code_hash);

alter table public.recovery_codes enable row level security;

-- Eigene Codes sehen (nur id + used_at — nie den Hash)
drop policy if exists "rc_select" on public.recovery_codes;
create policy "rc_select" on public.recovery_codes
  for select to authenticated
  using (user_id = auth.uid());

-- Inserts + updates laufen ausschließlich über die Service-Role (Server).
-- Kein RLS-Insert/Update für authenticated.

-- Redeem-RPC: Pre-auth callable. Vergleicht (email, code_hash) gegen einen
-- unbenutzten Eintrag, markiert ihn bei Treffer als verbraucht und gibt die
-- user_id zurück. Sonst null.
create or replace function public.redeem_recovery_code(
  p_email text,
  p_code_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  u_id uuid;
  rc_id uuid;
begin
  select id into u_id
  from auth.users
  where lower(btrim(email)) = lower(btrim(p_email))
  limit 1;

  if u_id is null then
    return null;
  end if;

  select id into rc_id
  from public.recovery_codes
  where user_id = u_id
    and code_hash = p_code_hash
    and used_at is null
  limit 1;

  if rc_id is null then
    return null;
  end if;

  update public.recovery_codes
  set used_at = now()
  where id = rc_id;

  return u_id;
end;
$$;

grant execute on function public.redeem_recovery_code(text, text)
  to anon, authenticated;

-- Helper für Status-Anzeige später: Anzahl unbenutzter Codes für den User.
create or replace function public.count_unused_recovery_codes()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.recovery_codes
  where user_id = auth.uid() and used_at is null;
$$;

grant execute on function public.count_unused_recovery_codes()
  to authenticated;
