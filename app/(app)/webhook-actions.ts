'use server';
import { createClient } from '@/lib/supabase/server';

const DISCORD_WEBHOOK_RE =
  /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;

type Ok = { ok: true };
type Err = { ok: false; error: string };

function validateUrl(url: string): string | null {
  if (!url) return 'URL fehlt.';
  if (url.length > 500) return 'URL zu lang.';
  if (!DISCORD_WEBHOOK_RE.test(url))
    return 'Das sieht nicht wie eine Discord-Webhook-URL aus. Erwartet: https://discord.com/api/webhooks/ID/TOKEN';
  return null;
}

export async function getBoardWebhook(
  boardId: string
): Promise<{ url: string; enabled: boolean; events: string[] } | null> {
  if (!boardId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('board_webhooks')
    .select('discord_url, enabled, events')
    .eq('board_id', boardId)
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    discord_url: string;
    enabled: boolean;
    events: string[];
  };
  return { url: row.discord_url, enabled: row.enabled, events: row.events };
}

export async function saveBoardWebhook(
  boardId: string,
  url: string,
  enabled: boolean,
  events: string[]
): Promise<Ok | Err> {
  if (!boardId) return { ok: false, error: 'Board fehlt.' };
  const urlError = validateUrl(url);
  if (urlError) return { ok: false, error: urlError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nicht angemeldet.' };

  const { error } = await supabase.from('board_webhooks').upsert(
    {
      board_id: boardId,
      discord_url: url,
      enabled,
      events: events.length > 0 ? events : ['card_created', 'card_moved'],
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'board_id' }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteBoardWebhook(
  boardId: string
): Promise<Ok | Err> {
  if (!boardId) return { ok: false, error: 'Board fehlt.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('board_webhooks')
    .delete()
    .eq('board_id', boardId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function postToDiscord(url: string, payload: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function boardLink(boardSlug: string, cardId?: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kanbanly.de';
  return cardId
    ? `${base}/boards/${boardSlug}?card=${cardId}`
    : `${base}/boards/${boardSlug}`;
}

export async function testBoardWebhook(boardId: string): Promise<Ok | Err> {
  const supabase = await createClient();
  const [webhookRes, boardRes, userRes] = await Promise.all([
    supabase
      .from('board_webhooks')
      .select('discord_url')
      .eq('board_id', boardId)
      .maybeSingle(),
    supabase.from('boards').select('name, slug').eq('id', boardId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const hook = webhookRes.data as { discord_url?: string } | null;
  if (!hook?.discord_url)
    return { ok: false, error: 'Kein Webhook konfiguriert.' };
  const board = boardRes.data as { name?: string; slug?: string } | null;
  const user = userRes.data.user;

  const username =
    user?.user_metadata && typeof user.user_metadata === 'object'
      ? (user.user_metadata as Record<string, unknown>).username
      : null;

  const ok = await postToDiscord(hook.discord_url, {
    username: 'kanbanly',
    embeds: [
      {
        title: 'Webhook-Test',
        description: `Der Discord-Webhook für **${board?.name ?? 'Board'}** funktioniert. Ausgelöst von **@${typeof username === 'string' ? username : 'dir'}**.`,
        color: 0x8b5cf6,
        url: board?.slug ? boardLink(board.slug) : undefined,
        timestamp: new Date().toISOString(),
      },
    ],
  });
  return ok
    ? { ok: true }
    : { ok: false, error: 'Discord hat die Nachricht abgelehnt. URL prüfen.' };
}

export type WebhookEvent =
  | { kind: 'card_created'; cardId: string; cardTitle: string; listTitle: string }
  | {
      kind: 'card_moved';
      cardId: string;
      cardTitle: string;
      fromList: string;
      toList: string;
    };

const EMBED_COLORS: Record<WebhookEvent['kind'], number> = {
  card_created: 0x22c55e,
  card_moved: 0x8b5cf6,
};

export async function notifyBoardEvent(
  boardId: string,
  event: WebhookEvent
): Promise<void> {
  if (!boardId) return;
  const supabase = await createClient();
  const [whRes, boardRes, userRes] = await Promise.all([
    supabase
      .from('board_webhooks')
      .select('discord_url, enabled, events')
      .eq('board_id', boardId)
      .maybeSingle(),
    supabase.from('boards').select('name, slug').eq('id', boardId).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const hook = whRes.data as {
    discord_url?: string;
    enabled?: boolean;
    events?: string[];
  } | null;
  if (!hook?.discord_url || !hook.enabled) return;
  if (hook.events && !hook.events.includes(event.kind)) return;

  const board = boardRes.data as { name?: string; slug?: string } | null;
  const boardName = board?.name ?? 'Board';
  const cardUrl = board?.slug
    ? boardLink(board.slug, event.cardId)
    : undefined;

  const username =
    userRes.data.user?.user_metadata &&
    typeof userRes.data.user.user_metadata === 'object'
      ? (userRes.data.user.user_metadata as Record<string, unknown>).username
      : null;
  const by = typeof username === 'string' ? `@${username}` : 'jemand';

  let title = '';
  let description = '';
  if (event.kind === 'card_created') {
    title = 'Neue Karte';
    description = `**${event.cardTitle}**\nin *${event.listTitle}* erstellt von ${by}`;
  } else {
    title = 'Karte verschoben';
    description = `**${event.cardTitle}**\n*${event.fromList}* → *${event.toList}* von ${by}`;
  }

  await postToDiscord(hook.discord_url, {
    username: `kanbanly · ${boardName}`,
    embeds: [
      {
        title,
        description,
        color: EMBED_COLORS[event.kind],
        url: cardUrl,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
