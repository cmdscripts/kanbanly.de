'use client';
import { useEffect, useRef } from 'react';
import { useBoard, type MemberProfile } from '@/store/boardStore';
import { createClient } from '@/lib/supabase/client';
import { fetchBoardData } from '@/lib/boardData';
import Board from './Board';
import { CardModal } from './CardModal';

type Props = {
  boardId: string;
  initialLists: Array<{ id: string; title: string; position: number }>;
  initialCards: Array<{
    id: string;
    list_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    position: number;
  }>;
  initialTasks: Array<{
    id: string;
    card_id: string;
    title: string;
    done: boolean;
    position: number;
  }>;
  initialAssignees: Array<{ card_id: string; user_id: string }>;
  initialMembers: MemberProfile[];
  initialLabels: Array<{
    id: string;
    name: string;
    color: string;
    created_at: string;
  }>;
  initialCardLabels: Array<{ card_id: string; label_id: string }>;
};

const REALTIME_TABLES = [
  'lists',
  'cards',
  'tasks',
  'labels',
  'card_assignees',
  'card_labels',
] as const;

const REFETCH_DEBOUNCE_MS = 300;

function extractCardId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as {
    table?: string;
    new?: Record<string, unknown>;
    old?: Record<string, unknown>;
  };
  const row = (p.new && Object.keys(p.new).length > 0 ? p.new : p.old) ?? null;
  if (!row) return null;
  switch (p.table) {
    case 'cards': {
      const id = row.id;
      return typeof id === 'string' ? id : null;
    }
    case 'tasks':
    case 'card_assignees':
    case 'card_labels': {
      const id = row.card_id;
      return typeof id === 'string' ? id : null;
    }
    default:
      return null;
  }
}

export function BoardClient({
  boardId,
  initialLists,
  initialCards,
  initialTasks,
  initialAssignees,
  initialMembers,
  initialLabels,
  initialCardLabels,
}: Props) {
  const hydrate = useBoard((s) => s.hydrate);
  const hydrateRef = useRef(hydrate);
  hydrateRef.current = hydrate;

  useEffect(() => {
    hydrate(
      boardId,
      initialLists,
      initialCards,
      initialTasks,
      initialAssignees,
      initialMembers,
      initialLabels,
      initialCardLabels
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const refetch = async () => {
      const data = await fetchBoardData(supabase, boardId);
      if (cancelled || !data) return;
      hydrateRef.current(
        boardId,
        data.initialLists,
        data.initialCards,
        data.initialTasks,
        data.initialAssignees,
        data.initialMembers,
        data.initialLabels,
        data.initialCardLabels
      );
    };

    const schedule = (payload: unknown) => {
      const cardId = extractCardId(payload);
      if (cardId) useBoard.getState().maybePulse(cardId);
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(refetch, REFETCH_DEBOUNCE_MS);
    };

    const channel = supabase.channel(`board-${boardId}`);
    for (const table of REALTIME_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        schedule
      );
    }

    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        supabase.realtime.setAuth(session?.access_token ?? null);
      }
    );

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (!cancelled) channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  return (
    <>
      <Board />
      <CardModal />
    </>
  );
}
