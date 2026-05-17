import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from 'discord.js';
import type { SlashCommand } from '../types.js';
import {
  ensureGuild,
  getFarewellConfig,
  renderWelcomeTemplate,
  setFarewellConfig,
} from '../db/guilds.js';
import { sendStyled } from '../lib/sendStyled.js';

const DEFAULT_TEMPLATE =
  '👋 {user} hat **{server}** verlassen. Noch {members} Mitglieder übrig.';

const data = new SlashCommandBuilder()
  .setName('farewell')
  .setDescription('Abschiedsnachrichten für Mitglieder, die den Server verlassen.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((sub) =>
    sub
      .setName('setup')
      .setDescription('Farewell-Channel und -Text setzen.')
      .addChannelOption((o) =>
        o
          .setName('channel')
          .setDescription('Channel, in dem ausgetretene Mitglieder verabschiedet werden.')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName('message')
          .setDescription(
            'Platzhalter: {user} {mention} {server} {members}. Leer = Default-Text.',
          )
          .setMaxLength(1000),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName('disable').setDescription('Farewell-Messages deaktivieren.'),
  )
  .addSubcommand((sub) =>
    sub.setName('show').setDescription('Aktuelle Farewell-Konfiguration anzeigen.'),
  )
  .addSubcommand((sub) =>
    sub
      .setName('test')
      .setDescription('Farewell-Message einmal testweise im konfigurierten Channel posten.'),
  );

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({
      content: 'Nur in Servern verwendbar.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await ensureGuild(interaction.guild);

  const sub = interaction.options.getSubcommand(true);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (sub === 'setup') {
    const channel = interaction.options.getChannel('channel', true);
    const messageRaw = interaction.options.getString('message');
    const message = messageRaw && messageRaw.trim().length > 0 ? messageRaw : DEFAULT_TEMPLATE;
    await setFarewellConfig(interaction.guild.id, {
      enabled: true,
      channelId: channel.id,
      message,
    });
    await interaction.editReply(
      `✅ Farewell aktiviert in <#${channel.id}>.\nText: ${message}`,
    );
    return;
  }

  if (sub === 'disable') {
    await setFarewellConfig(interaction.guild.id, { enabled: false });
    await interaction.editReply('🔕 Farewell-Messages deaktiviert.');
    return;
  }

  if (sub === 'show') {
    const cfg = await getFarewellConfig(interaction.guild.id);
    if (!cfg || !cfg.enabled) {
      await interaction.editReply('Farewell ist aktuell deaktiviert. `/farewell setup` zum Einrichten.');
      return;
    }
    await interaction.editReply(
      `**Status:** aktiv\n**Channel:** ${cfg.channelId ? `<#${cfg.channelId}>` : '— (nicht gesetzt)'}\n**Text:**\n${cfg.message ?? DEFAULT_TEMPLATE}`,
    );
    return;
  }

  if (sub === 'test') {
    const cfg = await getFarewellConfig(interaction.guild.id);
    if (!cfg || !cfg.enabled || !cfg.channelId) {
      await interaction.editReply('Erst mit `/farewell setup` einrichten.');
      return;
    }
    const channel = await interaction.guild.channels
      .fetch(cfg.channelId)
      .catch(() => null);
    if (!channel || !channel.isTextBased()) {
      await interaction.editReply(
        'Konfigurierter Channel existiert nicht mehr oder ist nicht textbasiert.',
      );
      return;
    }
    const rendered = renderWelcomeTemplate(cfg.message ?? DEFAULT_TEMPLATE, {
      username: interaction.user.username,
      mention: `<@${interaction.user.id}>`,
      serverName: interaction.guild.name,
      memberCount: interaction.guild.memberCount,
    });
    await sendStyled(channel as TextChannel, rendered, {
      useEmbed: cfg.useEmbed,
      embedColor: cfg.embedColor,
      allowedMentions: { parse: [] },
    });
    await interaction.editReply(`📨 Testnachricht in <#${cfg.channelId}> gepostet.`);
    return;
  }
}

const command: SlashCommand = { data, execute };
export default command;
