'use client';
import { useState } from 'react';
import { useBoard } from '@/store/boardStore';
import { PlusIcon } from './Icons';

export function AddListInline() {
  const addList = useBoard((s) => s.addList);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-[88vw] sm:w-[320px] shrink-0 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong hover:border-accent-hover/60 hover:bg-surface/40 text-muted hover:text-fg text-sm py-4 transition-colors"
      >
        <PlusIcon />
        Neue Spalte
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = title.trim();
        if (t) addList(t);
        setTitle('');
        setOpen(false);
      }}
      className="w-[88vw] sm:w-[320px] shrink-0 rounded-2xl bg-surface/70 border border-line/80 p-3 flex flex-col gap-2"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
        placeholder="Spaltentitel…"
        className="w-full rounded-lg bg-elev/80 border border-line-strong px-3 py-2 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent-hover/60"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-accent/90 hover:bg-accent-hover text-white text-xs font-medium py-1.5"
        >
          Hinzufügen
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
          className="rounded-lg px-3 text-xs text-muted hover:text-fg-soft"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
