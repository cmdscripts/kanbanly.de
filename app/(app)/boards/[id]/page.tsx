import Link from 'next/link';
import { notFound } from 'next/navigation';
import Board from '@/components/Board';
import { InviteDialog } from '@/components/InviteDialog';
import { createClient } from '@/lib/supabase/server';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: board } = await supabase
    .from('boards')
    .select('id, name, workspace_id, workspaces(name)')
    .eq('id', id)
    .single();

  if (!board) notFound();

  const workspace = Array.isArray(board.workspaces)
    ? board.workspaces[0]
    : board.workspaces;

  return (
    <>
      <div className="px-6 py-3 border-b border-slate-800/60 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 truncate">
            {workspace?.name ?? ''}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-medium truncate">
            {board.name}
          </span>
        </div>
        <InviteDialog boardId={board.id} />
      </div>
      <Board />
    </>
  );
}
