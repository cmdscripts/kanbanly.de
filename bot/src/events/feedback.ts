import {
  ActionRowBuilder,
  Events,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type Client,
  type Interaction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  type TextChannel,
} from 'discord.js';
import {
  createFeedback,
  getFeedbackConfig,
  renderFeedbackTemplate,
  setFeedbackMessageId,
} from '../db/feedback.js';
import { sendStyled } from '../lib/sendStyled.js';

async function handleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (!interaction.guild) return;
  const raw = interaction.values[0] ?? '';
  const rating = Math.max(1, Math.min(5, parseInt(raw, 10) || 0));
  if (rating < 1) {
    await interaction.reply({
      content: 'Ungültige Bewertung.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`fb:modal:${rating}`)
    .setTitle(`Feedback — ${rating} Stern${rating === 1 ? '' : 'e'}`);

  const input = new TextInputBuilder()
    .setCustomId('comment')
    .setLabel('Kommentar (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1500)
    .setPlaceholder('Was lief gut, was können wir besser machen?')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(input),
  );
  await interaction.showModal(modal);
}

async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.guild) return;
  const m = interaction.customId.match(/^fb:modal:(\d)$/);
  const rating = m ? parseInt(m[1], 10) : 0;
  if (rating < 1 || rating > 5) {
    await interaction.reply({
      content: 'Ungültige Bewertung.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const cfg = await getFeedbackConfig(interaction.guild.id);
  if (!cfg?.enabled || !cfg.channelId) {
    await interaction.editReply('Feedback ist nicht aktiv.');
    return;
  }
  const channel = (await interaction.guild.channels
    .fetch(cfg.channelId)
    .catch(() => null)) as TextChannel | null;
  if (!channel?.isTextBased()) {
    await interaction.editReply('Feedback-Channel existiert nicht mehr.');
    return;
  }

  const comment = interaction.fields.getTextInputValue('comment').trim();
  const username = interaction.user.username;

  const text = renderFeedbackTemplate(cfg.introMessage, {
    user: username,
    mention: `<@${interaction.user.id}>`,
    serverName: interaction.guild.name,
    rating,
    comment,
  });

  const record = await createFeedback({
    guildId: interaction.guild.id,
    channelId: cfg.channelId,
    userId: interaction.user.id,
    rating,
    comment: comment || null,
  });

  try {
    const sent = await sendStyled(channel, text, {
      useEmbed: cfg.useEmbed,
      embedTitle: cfg.embedTitle,
      embedColor: cfg.embedColor,
      embedFooter: cfg.footerText,
      allowedMentions: { parse: [] },
    });
    if (sent && typeof sent === 'object' && 'id' in sent) {
      await setFeedbackMessageId(record.id, (sent as { id: string }).id);
    }
    await interaction.editReply(
      `✓ Danke für dein Feedback! Es wurde in <#${cfg.channelId}> gepostet.`,
    );
  } catch (err) {
    console.error('[feedback] post', err);
    await interaction.editReply('Konnte das Feedback nicht posten.');
  }
}

export function registerFeedback(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isStringSelectMenu() && interaction.customId === 'fb:rate') {
        await handleSelect(interaction);
        return;
      }
      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith('fb:modal:')
      ) {
        await handleModal(interaction);
        return;
      }
    } catch (err) {
      console.error('[feedback]', err);
    }
  });
}
