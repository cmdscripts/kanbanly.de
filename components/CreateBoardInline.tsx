'use client';
import { useState } from 'react';
import { createBoard } from '@/app/(app)/actions';
import { PlusIcon } from './Icons';

export function CreateBoardInline({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-full min-h-[84px] flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 hover:border-violet-400/60 hover:bg-slate-900/40 text-slate-400 hover:text-slate-100 text-sm transition-colors"
      >
        <PlusIcon />
        Neues Board
      </button>
    );
  }

  return (
    <form
      action={createBoard}
      className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 flex flex-col gap-2"
    >
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input
        autoFocus
        name="name"
        required
        placeholder="Board-Name"
        className="rounded-md bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-violet-500/90 hover:bg-violet-400 text-white text-xs font-medium py-1.5"
        >
          Erstellen
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-2 text-xs text-slate-400 hover:text-slate-200"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
