import {
  ActionRowBuilder,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { SlashCommand } from '../types.js';
import { ensureGuild } from '../db/guilds.js';
import { getFeedbackConfig } from '../db/feedback.js';

const data = new SlashCommandBuilder()
  .setName('feedback')
  .setDescription('Hinterlasse Feedback mit Sterne-Bewertung und optionalem Kommentar.')
  .setDMPermission(false);

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({
      content: 'Nur in Servern verwendbar.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await ensureGuild(interaction.guild);
  const cfg = await getFeedbackConfig(interaction.guild.id);
  if (!cfg?.enabled || !cfg.channelId) {
    await interaction.reply({
      content: 'Feedback ist auf diesem Server nicht aktiv.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('fb:rate')
    .setPlaceholder('Wie zufrieden bist du? (1-5 Sterne)')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('5 Sterne — Hervorragend')
        .setValue('5')
        .setEmoji('🤩'),
      new StringSelectMenuOptionBuilder()
        .setLabel('4 Sterne — Gut')
        .setValue('4')
        .setEmoji('😊'),
      new StringSelectMenuOptionBuilder()
        .setLabel('3 Sterne — Okay')
        .setValue('3')
        .setEmoji('😐'),
      new StringSelectMenuOptionBuilder()
        .setLabel('2 Sterne — Verbesserungswürdig')
        .setValue('2')
        .setEmoji('😕'),
      new StringSelectMenuOptionBuilder()
        .setLabel('1 Stern — Schlecht')
        .setValue('1')
        .setEmoji('😞'),
    );

  await interaction.reply({
    content: 'Wähle deine Bewertung — danach kannst du optional einen Kommentar abgeben.',
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

const command: SlashCommand = { data, execute };
export default command;
