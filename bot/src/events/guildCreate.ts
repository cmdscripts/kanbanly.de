import { Events, type Client } from 'discord.js';
import { ensureGuild } from '../db/guilds.js';
import { applyCustomization } from '../db/customization.js';

export function registerGuildCreate(client: Client): void {
  client.on(Events.GuildCreate, async (guild) => {
    try {
      await ensureGuild(guild);
      console.log(`[guildCreate] Bot zu "${guild.name}" (${guild.id}) hinzugefügt.`);
    } catch (err) {
      console.error('[guildCreate] ensureGuild fehlgeschlagen:', err);
    }
    // Falls Customization aus früherem Aufenthalt vorhanden ist → wieder anwenden.
    applyCustomization(client, guild.id).catch((err) =>
      console.warn(`[guildCreate] customization (${guild.id}):`, err),
    );
  });
}
