'use client';
import { useState } from 'react';
import { createWorkspace } from '@/app/(app)/actions';
import { PlusIcon } from './Icons';

export function CreateWorkspaceInline() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-violet-500/90 hover:bg-violet-400 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        <PlusIcon />
        Neuer Workspace
      </button>
    );
  }

  return (
    <form
      action={createWorkspace}
      className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-800/80 p-2"
    >
      <input
        autoFocus
        name="name"
        required
        placeholder="Workspace-Name"
        className="rounded-md bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
      />
      <button
        type="submit"
        className="rounded-md bg-violet-500/90 hover:bg-violet-400 text-white text-xs font-medium px-3 py-1.5"
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
    </form>
  );
}
