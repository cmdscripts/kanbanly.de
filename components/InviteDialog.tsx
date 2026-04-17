'use client';
import { useActionState, useState } from 'react';
import { createInvite } from '@/app/(app)/invite-actions';

export function InviteDialog({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInvite, null);
  const [copied, setCopied] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-700 hover:border-violet-400/60 bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium px-3 py-1.5 transition-colors"
      >
        Einladen
      </button>
    );
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Mitglied einladen
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generiert einen Einladungs-Link. Schick ihn selbst weiter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-slate-200 text-xl leading-none"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        {state?.ok ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-2">
              Einladung erstellt. Kopier den Link und schick ihn der Person.
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={state.url}
                className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => copyLink(state.url)}
                className="rounded-lg bg-violet-500/90 hover:bg-violet-400 text-white text-xs font-medium px-4 py-2 transition-colors"
              >
                {copied ? 'Kopiert ✓' : 'Kopieren'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 transition-colors"
            >
              Fertig
            </button>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="board_id" value={boardId} />

            {state && !state.ok && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs px-3 py-2">
                {state.error}
              </div>
            )}

            <div>
              <label
                className="block text-xs text-slate-400 mb-1"
                htmlFor="inv-email"
              >
                E-Mail
              </label>
              <input
                id="inv-email"
                name="email"
                type="email"
                required
                placeholder="kollege@firma.de"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              />
            </div>

            <div>
              <label
                className="block text-xs text-slate-400 mb-1"
                htmlFor="inv-role"
              >
                Rolle
              </label>
              <select
                id="inv-role"
                name="role"
                defaultValue="editor"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
              >
                <option value="viewer">Viewer — nur lesen</option>
                <option value="editor">Editor — Karten bearbeiten</option>
                <option value="admin">Admin — alles inkl. Einladen</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-violet-500/90 hover:bg-violet-400 disabled:opacity-60 text-white text-sm font-medium py-2 transition-colors"
            >
              {pending ? 'Erstelle…' : 'Einladung erstellen'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
