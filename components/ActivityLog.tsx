'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ActivityKind =
  | 'created'
  | 'renamed'
  | 'described'
  | 'due_set'
  | 'due_cleared'
  | 'moved'
  | 'assignee_added'
  | 'assignee_removed'
  | 'label_added'
  | 'label_removed'
  | 'task_added'
  | 'task_done'
  | 'task_undone'
  | 'task_deleted';

type ActivityRow = {
  id: string;
  card_id: string;
  user_id: string;
  kind: ActivityKind;
  meta: Record<string, unknown> | null;
  created_at: string;
};

type ActivityWithUser = ActivityRow & {
  username: string | null;
};

function describe(row: ActivityRow): string {
  const m = row.meta ?? {};
  switch (row.kind) {
    case 'created':
      return 'hat die Karte erstellt';
    case 'renamed':
      return `hat die Karte umbenannt zu „${String(m.to ?? '')}"`;
    case 'described':
      return 'hat die Beschreibung geändert';
    case 'due_set':
      return `hat das Fälligkeitsdatum auf ${String(m.due ?? '')} gesetzt`;
    case 'due_cleared':
      return 'hat das Fälligkeitsdatum entfernt';
    case 'moved':
      return `hat die Karte von „${String(m.from ?? '')}" nach „${String(m.to ?? '')}" verschoben`;
    case 'assignee_added':
      return `hat @${String(m.username ?? 'jemand')} zugewiesen`;
    case 'assignee_removed':
      return `hat @${String(m.username ?? 'jemand')} entfernt`;
    case 'label_added':
      return `hat das Label „${String(m.label ?? '')}" gesetzt`;
    case 'label_removed':
      return `hat das Label „${String(m.label ?? '')}" entfernt`;
    case 'task_added':
      return `hat den Task „${String(m.title ?? '')}" hinzugefügt`;
    case 'task_done':
      return `hat „${String(m.title ?? '')}" abgehakt`;
    case 'task_undone':
      return `hat „${String(m.title ?? '')}" wieder offen gesetzt`;
    case 'task_deleted':
      return `hat den Task „${String(m.title ?? '')}" gelöscht`;
    default:
      return 'hat die Karte geändert';
  }
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'gerade eben';
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} Tg.`;
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ActivityLog({ cardId }: { cardId: string }) {
  const [rows, setRows] = useState<ActivityWithUser[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadUsernames = async (
      activities: ActivityRow[]
    ): Promise<ActivityWithUser[]> => {
      const userIds = Array.from(new Set(activities.map((a) => a.user_id)));
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('id, username')
        .in('id', userIds);
      const nameById = new Map<string, string | null>();
      for (const p of (profiles ?? []) as Array<{
        id: string;
        username: string | null;
      }>) {
        nameById.set(p.id, p.username);
      }
      return activities.map((a) => ({
        ...a,
        username: nameById.get(a.user_id) ?? null,
      }));
    };

    const load = async () => {
      const { data } = await supabase
        .from('card_activity')
        .select('id, card_id, user_id, kind, meta, created_at')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (cancelled) return;
      const withUsers = await loadUsernames((data ?? []) as ActivityRow[]);
      if (!cancelled) setRows(withUsers);
    };

    load();

    const channel = supabase
      .channel(`activity-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'card_activity',
          filter: `card_id=eq.${cardId}`,
        },
        async (payload) => {
          const row = payload.new as ActivityRow;
          const [withUser] = await loadUsernames([row]);
          if (cancelled) return;
          setRows((prev) => (prev ? [withUser, ...prev] : [withUser]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [cardId]);

  if (rows === null) {
    return (
      <p className="text-xs text-subtle font-mono">Aktivität wird geladen…</p>
    );
  }

  if (rows.length === 0) {
    return <p className="text-xs text-subtle">Noch keine Aktivität.</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="text-xs text-muted leading-relaxed">
          <span className="text-fg-soft font-medium">
            @{r.username ?? 'unbekannt'}
          </span>{' '}
          {describe(r)}
          <span className="ml-2 text-[10px] text-faint font-mono tabular-nums">
            {relativeTime(r.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
