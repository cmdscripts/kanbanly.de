'use client';
import { useActionState, useCallback, useEffect, useState } from 'react';
import {
  createInvite,
  removeBoardMember,
  updateBoardMemberRole,
} from '@/app/(app)/invite-actions';
import { createClient } from '@/lib/supabase/client';
import { confirm } from '@/store/confirmStore';
import { Avatar } from './Avatar';

type MemberRow = {
  user_id: string;
  username: string | null;
  role: string;
  source: 'workspace' | 'board';
};

type BoardRow = {
  workspace_id: string;
};

type WsMemberRow = {
  user_id: string;
  role: string;
  profiles: { username: string | null } | { username: string | null }[] | null;
};

type BdMemberRow = {
  user_id: string;
  role: string;
  profiles: { username: string | null } | { username: string | null }[] | null;
};

function pickUsername(
  p: WsMemberRow['profiles']
): string | null {
  if (!p) return null;
  const row = Array.isArray(p) ? p[0] : p;
  return row?.username ?? null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Mitglied',
  viewer: 'Viewer',
  editor: 'Editor',
};

const BOARD_ROLES: Array<{ value: 'viewer' | 'editor' | 'admin'; label: string }> =
  [
    { value: 'viewer', label: 'Viewer — nur lesen' },
    { value: 'editor', label: 'Editor — bearbeiten' },
    { value: 'admin', label: 'Admin — voll' },
  ];

export function MembersDialog({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteState, inviteAction, invitePending] = useActionState(
    createInvite,
    null
  );
  const [copied, setCopied] = useState(false);

  const loadMembers = useCallback(async () => {
    const supabase = createClient();
    const { data: boardRaw } = await supabase
      .from('boards')
      .select('workspace_id')
      .eq('id', boardId)
      .maybeSingle();
    const board = boardRaw as BoardRow | null;
    if (!board) return;

    const [{ data: wsRaw }, { data: bdRaw }] = await Promise.all([
      supabase
        .from('workspace_members')
        .select('user_id, role, profiles(username)')
        .eq('workspace_id', board.workspace_id),
      supabase
        .from('board_members')
        .select('user_id, role, profiles(username)')
        .eq('board_id', boardId),
    ]);

    const ws = (wsRaw ?? []) as unknown as WsMemberRow[];
    const bd = (bdRaw ?? []) as unknown as BdMemberRow[];

    const seen = new Set<string>();
    const rows: MemberRow[] = [];
    for (const r of ws) {
      if (seen.has(r.user_id)) continue;
      seen.add(r.user_id);
      rows.push({
        user_id: r.user_id,
        username: pickUsername(r.profiles),
        role: r.role,
        source: 'workspace',
      });
    }
    for (const r of bd) {
      if (seen.has(r.user_id)) continue;
      seen.add(r.user_id);
      rows.push({
        user_id: r.user_id,
        username: pickUsername(r.profiles),
        role: r.role,
        source: 'board',
      });
    }
    rows.sort((a, b) => {
      if (a.source !== b.source) return a.source === 'workspace' ? -1 : 1;
      return (a.username ?? '').localeCompare(b.username ?? '');
    });
    setMembers(rows);
  }, [boardId]);

  useEffect(() => {
    if (!open) return;
    setActionError(null);
    loadMembers();
  }, [open, loadMembers]);

  useEffect(() => {
    if (inviteState?.ok) loadMembers();
  }, [inviteState, loadMembers]);

  const handleRoleChange = async (
    userId: string,
    role: 'viewer' | 'editor' | 'admin'
  ) => {
    setActionError(null);
    const res = await updateBoardMemberRole(boardId, userId, role);
    if (!res.ok) setActionError(res.error ?? 'Fehler beim Speichern.');
    else loadMembers();
  };

  const handleRemove = async (row: MemberRow) => {
    setActionError(null);
    const ok = await confirm({
      title: `@${row.username ?? 'user'} entfernen?`,
      description:
        'Die Person verliert den Zugriff auf dieses Board. Zugewiesene Karten bleiben bestehen, ohne Zuweisung.',
      confirmLabel: 'Entfernen',
      danger: true,
    });
    if (!ok) return;
    const res = await removeBoardMember(boardId, row.user_id);
    if (!res.ok) setActionError(res.error ?? 'Fehler beim Entfernen.');
    else loadMembers();
  };

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line-strong hover:border-accent-hover/60 bg-elev/60 hover:bg-elev text-fg-soft hover:text-white text-xs font-medium px-3 py-1.5 transition-colors"
      >
        Mitglieder
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mt-10 mb-10 rounded-2xl bg-surface border border-line shadow-2xl"
      >
        <div className="px-5 pt-5 pb-4 border-b border-line flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Mitglieder</h2>
            <p className="text-xs text-muted mt-0.5">
              Rollen ändern, Board-Gäste entfernen, neue Einladungen erstellen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-subtle hover:text-fg-soft text-xl leading-none"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        {actionError && (
          <div className="mx-5 mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs px-3 py-2">
            {actionError}
          </div>
        )}

        <section className="p-5 border-b border-line">
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">
            Aktuelle Mitglieder
          </h3>
          {members === null ? (
            <p className="text-xs text-subtle font-mono">Lädt…</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-subtle">Noch niemand.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center gap-3 rounded-lg bg-elev/50 border border-line px-3 py-2"
                >
                  <Avatar username={m.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-fg truncate">
                      @{m.username ?? 'user'}
                    </div>
                    <div className="text-[10px] text-subtle mt-0.5">
                      {m.source === 'workspace' ? (
                        <span>
                          Workspace-Mitglied
                          <span className="mx-1 text-faint">·</span>
                          {ROLE_LABELS[m.role] ?? m.role}
                        </span>
                      ) : (
                        <span>Board-Gast</span>
                      )}
                    </div>
                  </div>
                  {m.source === 'board' ? (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(
                            m.user_id,
                            e.target.value as 'viewer' | 'editor' | 'admin'
                          )
                        }
                        className="rounded-md bg-elev border border-line-strong text-[11px] text-fg-soft px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent-hover/60"
                      >
                        {BOARD_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemove(m)}
                        className="text-[11px] text-muted hover:text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        Entfernen
                      </button>
                    </>
                  ) : (
                    <span
                      className="text-[10px] text-subtle italic"
                      title="Zugriff über den Workspace — dort verwalten"
                    >
                      über Workspace
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="p-5">
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">
            Neue Einladung
          </h3>
          {inviteState?.ok ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs px-3 py-2">
                Einladung erstellt. Kopier den Link und schick ihn der Person.
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteState.url}
                  className="flex-1 rounded-lg bg-elev border border-line-strong px-3 py-2 text-xs text-fg-soft font-mono focus:outline-none focus:ring-2 focus:ring-accent-hover/60"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => copyLink(inviteState.url)}
                  className="rounded-lg bg-accent/90 hover:bg-accent-hover text-white text-xs font-medium px-4 py-2 transition-colors"
                >
                  {copied ? 'Kopiert ✓' : 'Kopieren'}
                </button>
              </div>
            </div>
          ) : (
            <form action={inviteAction} className="space-y-3">
              <input type="hidden" name="board_id" value={boardId} />
              {inviteState && !inviteState.ok && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs px-3 py-2">
                  {inviteState.error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="kollege@firma.de"
                  className="flex-1 rounded-lg bg-elev border border-line-strong px-3 py-2 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent-hover/60"
                />
                <select
                  name="role"
                  defaultValue="editor"
                  className="rounded-lg bg-elev border border-line-strong px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent-hover/60"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={invitePending}
                className="w-full rounded-lg bg-accent/90 hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium py-2 transition-colors"
              >
                {invitePending ? 'Erstelle…' : 'Einladungs-Link erstellen'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
