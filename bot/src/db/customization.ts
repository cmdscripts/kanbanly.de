import type { Client } from 'discord.js';
import { getDb } from '../db.js';

export type GuildCustomization = {
  nickname: string | null;
  avatarUrl: string | null;
};

export async function getCustomization(
  guildId: string,
): Promise<GuildCustomization | null> {
  const db = getDb();
  const { data, error } = await db
    .from('bot_guild_customization')
    .select('nickname, avatar_url')
    .eq('guild_id', guildId)
    .maybeSingle();
  if (error) {
    console.error('[customization] db read:', error);
    return null;
  }
  if (!data) return null;
  return {
    nickname: (data.nickname as string | null) ?? null,
    avatarUrl: (data.avatar_url as string | null) ?? null,
  };
}

/**
 * Wendet die gespeicherte Customization auf den Bot in dieser Guild an.
 * Setzt Nickname und/oder Server-Avatar. Bei `null`-Werten wird auf den
 * globalen Bot-Wert zurückgefallen (Discord-Reset).
 */
export async function applyCustomization(
  client: Client,
  guildId: string,
): Promise<void> {
  const custom = await getCustomization(guildId);
  // Wenn keine Row existiert → nicht anrühren. Reset passiert explizit über DELETE.
  if (!custom) return;

  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId).catch(() => null));
  if (!guild) return;

  const me = await guild.members.fetchMe().catch(() => null);
  if (!me) return;

  // Nickname
  try {
    const current = me.nickname ?? null;
    const desired = custom.nickname;
    if (current !== desired) {
      await me.setNickname(desired ?? null, 'Server-Customization');
    }
  } catch (err) {
    console.warn(`[customization] setNickname (${guildId}):`, err);
  }

  // Server-Avatar via REST. discord.js hat keinen High-Level-Helper dafür.
  // Endpoint: PATCH /guilds/{guild.id}/members/@me   { avatar: base64 | null }
  try {
    let body: { avatar: string | null };
    if (custom.avatarUrl) {
      const buf = await fetchImageAsBase64(custom.avatarUrl);
      if (!buf) {
        console.warn(`[customization] Avatar-Download fehlgeschlagen für ${guildId}`);
        return;
      }
      body = { avatar: buf };
    } else {
      body = { avatar: null };
    }
    await client.rest.patch(`/guilds/${guildId}/members/@me`, { body });
  } catch (err) {
    // Rate-Limit (429) ist hier zu erwarten — Discord lässt nur ~2/h zu.
    const e = err as { code?: number; status?: number; message?: string };
    if (e?.status === 429) {
      console.warn(`[customization] Avatar Rate-Limit (${guildId}) — überspringe.`);
    } else {
      console.warn(`[customization] setAvatar (${guildId}):`, err);
    }
  }
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? 'image/png';
    if (!ct.startsWith('image/')) return null;
    const arr = await res.arrayBuffer();
    if (arr.byteLength > 256 * 1024) {
      console.warn(`[customization] Avatar zu groß (${arr.byteLength} bytes), Discord-Limit 256KB.`);
      return null;
    }
    const b64 = Buffer.from(arr).toString('base64');
    return `data:${ct};base64,${b64}`;
  } catch (err) {
    console.warn('[customization] fetchImage:', err);
    return null;
  }
}

let realtimeStarted = false;
export function startCustomizationRealtime(client: Client): void {
  if (realtimeStarted) return;
  realtimeStarted = true;
  const db = getDb();
  db.channel('bot-guild-customization')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bot_guild_customization' },
      (payload) => {
        const row =
          (payload.new as { guild_id?: string } | null) ??
          (payload.old as { guild_id?: string } | null);
        const gid = row?.guild_id;
        if (!gid) return;
        applyCustomization(client, gid).catch((err) =>
          console.error(`[customization] apply (${gid}):`, err),
        );
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[customization] Realtime-Subscription aktiv');
      }
    });
}

/**
 * Beim Bot-Start einmal über alle Guilds laufen — synchronisiert verpasste
 * Änderungen, die während Bot-Downtime passiert sind.
 */
export async function applyAllCustomizationsOnStartup(
  client: Client,
): Promise<void> {
  const db = getDb();
  const { data, error } = await db
    .from('bot_guild_customization')
    .select('guild_id');
  if (error) {
    console.error('[customization] startup-load:', error);
    return;
  }
  for (const row of data ?? []) {
    const gid = row.guild_id as string;
    await applyCustomization(client, gid).catch((err) =>
      console.warn(`[customization] startup-apply (${gid}):`, err),
    );
  }
  console.log(`[customization] Startup-Sync: ${data?.length ?? 0} Guild(s) verarbeitet.`);
}
