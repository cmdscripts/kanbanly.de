-- Block 7: human-readable URL slugs for workspaces + boards.
-- Slugs are stable once assigned (renaming the workspace/board does not
-- change the slug, so existing shared links keep working).

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ),
    ''
  );
$$;

alter table public.workspaces add column if not exists slug text;
alter table public.boards add column if not exists slug text;

-- Backfill: derive slug from name, suffix with row_number on collisions.
with numbered as (
  select
    id,
    coalesce(public.slugify(name), 'workspace') as base,
    row_number() over (
      partition by coalesce(public.slugify(name), 'workspace')
      order by created_at, id
    ) as rn
  from public.workspaces
  where slug is null
)
update public.workspaces w
set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
from numbered n
where w.id = n.id;

with numbered as (
  select
    id,
    coalesce(public.slugify(name), 'board') as base,
    row_number() over (
      partition by coalesce(public.slugify(name), 'board')
      order by created_at, id
    ) as rn
  from public.boards
  where slug is null
)
update public.boards b
set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
from numbered n
where b.id = n.id;

alter table public.workspaces alter column slug set not null;
alter table public.boards alter column slug set not null;

create unique index if not exists idx_workspaces_slug on public.workspaces(slug);
create unique index if not exists idx_boards_slug on public.boards(slug);
