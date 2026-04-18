'use server';
import { createClient } from '@/lib/supabase/server';

export type SearchBoard = {
  id: string;
  name: string;
  slug: string;
  workspace_name: string | null;
};

export type SearchWorkspace = {
  id: string;
  name: string;
  slug: string;
};

export type SearchCard = {
  id: string;
  title: string;
  board_slug: string;
  board_name: string;
};

export type SearchResults = {
  boards: SearchBoard[];
  workspaces: SearchWorkspace[];
  cards: SearchCard[];
};

type BoardRow = {
  id: string;
  name: string;
  slug: string;
  workspaces: { name: string | null } | { name: string | null }[] | null;
};

type CardRow = {
  id: string;
  title: string;
  lists:
    | { boards: { slug: string; name: string } | { slug: string; name: string }[] | null }
    | { boards: { slug: string; name: string } | { slug: string; name: string }[] | null }[]
    | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function searchContent(query: string): Promise<SearchResults> {
  const supabase = await createClient();
  const q = query.trim();
  const pattern = `%${q}%`;

  const boardsQ = supabase
    .from('boards')
    .select('id, name, slug, workspaces!inner(name)')
    .ilike('name', pattern)
    .limit(8);

  const workspacesQ = supabase
    .from('workspaces')
    .select('id, name, slug')
    .ilike('name', pattern)
    .limit(4);

  const cardsQ =
    q.length >= 2
      ? supabase
          .from('cards')
          .select('id, title, lists!inner(boards!inner(slug, name))')
          .ilike('title', pattern)
          .limit(10)
      : null;

  const [boardsRes, workspacesRes, cardsRes] = await Promise.all([
    boardsQ,
    workspacesQ,
    cardsQ ?? Promise.resolve({ data: [] as CardRow[], error: null }),
  ]);

  const boards: SearchBoard[] = ((boardsRes.data ?? []) as BoardRow[]).map(
    (b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      workspace_name: pickOne(b.workspaces)?.name ?? null,
    })
  );

  const workspaces: SearchWorkspace[] = (workspacesRes.data ??
    []) as SearchWorkspace[];

  const cards: SearchCard[] = ((cardsRes.data ?? []) as CardRow[])
    .map((c) => {
      const list = pickOne(c.lists);
      const board = list ? pickOne(list.boards) : null;
      if (!board) return null;
      return {
        id: c.id,
        title: c.title,
        board_slug: board.slug,
        board_name: board.name,
      };
    })
    .filter((x): x is SearchCard => x !== null);

  return { boards, workspaces, cards };
}
