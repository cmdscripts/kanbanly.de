import { Events, type Client, type GuildMember, type PartialGuildMember, type TextChannel } from 'discord.js';
import { getFarewellConfig, renderWelcomeTemplate } from '../db/guilds.js';
import { sendStyled } from '../lib/sendStyled.js';

export function registerGuildMemberRemove(client: Client): void {
  client.on(Events.GuildMemberRemove, async (member: GuildMember | PartialGuildMember) => {
    try {
      if (member.user?.bot) return;

      const cfg = await getFarewellConfig(member.guild.id);
      if (!cfg || !cfg.enabled || !cfg.channelId || !cfg.message) return;

      const channel = await member.guild.channels.fetch(cfg.channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;

      const username = member.user?.username ?? 'Unbekannt';
      const text = renderWelcomeTemplate(cfg.message, {
        username,
        mention: `<@${member.id}>`,
        serverName: member.guild.name,
        memberCount: member.guild.memberCount,
      });

      await sendStyled(channel as TextChannel, text, {
        useEmbed: cfg.useEmbed,
        embedColor: cfg.embedColor,
        // Kein Ping — der User ist weg.
        allowedMentions: { parse: [] },
      });
    } catch (err) {
      console.error('[farewell] Fehler beim Abschiednehmen:', err);
    }
  });
}
