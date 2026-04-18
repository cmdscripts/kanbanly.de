import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CreateWorkspaceInline } from '@/components/CreateWorkspaceInline';
import { CreateBoardInline } from '@/components/CreateBoardInline';

export const metadata = {
  title: 'Dashboard · kanbanly',
};

type SearchParams = { error?: string };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    username = profile?.username ?? null;
  }

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, slug, name, boards(id, slug, name, created_at)')
    .order('created_at', { ascending: true });

  const myWorkspaceIds = (workspaces ?? []).map((w) => w.id);

  type GuestRow = {
    role: string;
    boards: {
      id: string;
      slug: string;
      name: string;
      workspace_id: string;
      workspaces: { name: string | null; slug: string | null } | { name: string | null; slug: string | null }[] | null;
    } | null;
  };

  const { data: guestRaw } = user
    ? await supabase
        .from('board_members')
        .select(
          'role, boards(id, slug, name, workspace_id, workspaces(name, slug))'
        )
        .eq('user_id', user.id)
    : { data: null };

  const guestBoards = ((guestRaw ?? []) as unknown as GuestRow[])
    .map((g) => {
      if (!g.boards) return null;
      if (myWorkspaceIds.includes(g.boards.workspace_id)) return null;
      const ws = Array.isArray(g.boards.workspaces)
        ? g.boards.workspaces[0] ?? null
        : g.boards.workspaces;
      return {
        id: g.boards.id,
        slug: g.boards.slug,
        name: g.boards.name,
        role: g.role,
        workspace_name: ws?.name ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
            <p className="text-sm text-muted mt-1">
              Willkommen{username ? ` @${username}` : ''}
            </p>
          </div>
          <CreateWorkspaceInline />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs px-3 py-2">
            {error}
          </div>
        )}

        {(!workspaces || workspaces.length === 0) && guestBoards.length === 0 ? (
          <div className="rounded-2xl bg-surface/60 border border-line/80 p-10 text-center">
            <h2 className="text-lg font-semibold text-fg mb-1">
              Keine Workspaces
            </h2>
            <p className="text-sm text-muted mb-5">
              Leg deinen ersten Workspace an, um mit Boards zu starten.
            </p>
            <div className="inline-flex">
              <CreateWorkspaceInline />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {guestBoards.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-fg tracking-wide uppercase">
                    Als Gast
                  </h2>
                  <span className="text-[11px] text-subtle">
                    {guestBoards.length} Board
                    {guestBoards.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {guestBoards.map((b) => (
                    <Link
                      key={b.id}
                      href={`/boards/${b.slug}`}
                      className="rounded-xl bg-surface/60 border border-line/80 p-4 hover:border-accent-hover/60 hover:bg-surface/80 transition-colors min-h-[84px] flex flex-col justify-between"
                    >
                      <div className="font-medium text-fg text-sm leading-snug break-words">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-subtle mt-1">
                        {b.workspace_name ?? ''}
                        <span className="mx-1 text-faint">·</span>
                        {b.role}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {(workspaces ?? []).map((ws) => (
              <section key={ws.id}>
                <div className="flex items-center justify-between mb-3">
                  <Link
                    href={`/workspaces/${ws.slug}`}
                    className="text-sm font-semibold text-fg tracking-wide uppercase hover:text-accent-hover transition-colors"
                  >
                    {ws.name}
                  </Link>
                  <span className="text-[11px] text-subtle">
                    {ws.boards?.length ?? 0} Boards
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(ws.boards ?? []).map((b) => (
                    <Link
                      key={b.id}
                      href={`/boards/${b.slug}`}
                      className="rounded-xl bg-surface/60 border border-line/80 p-4 hover:border-accent-hover/60 hover:bg-surface/80 transition-colors min-h-[84px] flex items-center"
                    >
                      <div className="font-medium text-fg text-sm leading-snug break-words">
                        {b.name}
                      </div>
                    </Link>
                  ))}
                  <CreateBoardInline workspaceId={ws.id} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
