import { getDb } from '../db.js';

export type FeedbackConfig = {
  enabled: boolean;
  channelId: string | null;
  useEmbed: boolean;
  embedColor: number | null;
  embedTitle: string;
  introMessage: string;
  footerText: string | null;
};

export const DEFAULT_FEEDBACK_TITLE = 'Neues Feedback';
export const DEFAULT_FEEDBACK_INTRO =
  '{user} hat Feedback hinterlassen\n\n**Bewertung:** {stars} ({rating}/5)\n**Kommentar:**\n{comment}';

export async function getFeedbackConfig(
  guildId: string,
): Promise<FeedbackConfig | null> {
  const db = getDb();
  const { data, error } = await db
    .from('bot_guilds')
    .select(
      'feedback_enabled, feedback_channel_id, feedback_use_embed, feedback_embed_color, feedback_embed_title, feedback_intro_message, feedback_footer_text',
    )
    .eq('guild_id', guildId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    enabled: Boolean(data.feedback_enabled),
    channelId: (data.feedback_channel_id as string | null) ?? null,
    useEmbed: data.feedback_use_embed === false ? false : true,
    embedColor: (data.feedback_embed_color as number | null) ?? null,
    embedTitle:
      (data.feedback_embed_title as string | null) ?? DEFAULT_FEEDBACK_TITLE,
    introMessage:
      (data.feedback_intro_message as string | null) ?? DEFAULT_FEEDBACK_INTRO,
    footerText: (data.feedback_footer_text as string | null) ?? null,
  };
}

export async function createFeedback(input: {
  guildId: string;
  channelId: string;
  userId: string;
  rating: number;
  comment: string | null;
  messageId?: string | null;
}): Promise<{ id: string }> {
  const db = getDb();
  const { data, error } = await db
    .from('bot_feedback')
    .insert({
      guild_id: input.guildId,
      channel_id: input.channelId,
      user_id: input.userId,
      rating: input.rating,
      comment: input.comment,
      message_id: input.messageId ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('Insert fehlgeschlagen.');
  return { id: data.id as string };
}

export async function setFeedbackMessageId(
  id: string,
  messageId: string,
): Promise<void> {
  const db = getDb();
  await db.from('bot_feedback').update({ message_id: messageId }).eq('id', id);
}

export function renderStars(rating: number): string {
  const r = Math.max(0, Math.min(5, rating));
  return '⭐'.repeat(r) + '·'.repeat(5 - r);
}

export function renderFeedbackTemplate(
  template: string,
  ctx: {
    user: string;
    mention: string;
    serverName: string;
    rating: number;
    comment: string;
  },
): string {
  return template
    .replaceAll('{user}', ctx.user)
    .replaceAll('{mention}', ctx.mention)
    .replaceAll('{server}', ctx.serverName)
    .replaceAll('{rating}', String(ctx.rating))
    .replaceAll('{stars}', renderStars(ctx.rating))
    .replaceAll('{comment}', ctx.comment.trim() ? ctx.comment : '_(kein Kommentar)_');
}
