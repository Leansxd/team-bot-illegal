const { EmbedBuilder } = require('discord.js');

// Centralized embed style helpers
// Palette (Discord branding inspired)
const Colors = {
  primary: 0x5865f2,
  success: 0x57f287,
  danger: 0xed4245,
  warning: 0xfee75c,
  info: 0x3498db,
  neutral: 0x2f3136
};

function baseEmbed(interaction, { title, description, color = Colors.primary, fields = [], thumbnail, image, footerText } = {}) {
  const guild = interaction.guild;
  const clientUser = interaction.client?.user;
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTimestamp();

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields && fields.length) embed.addFields(fields);

  // Author (guild name + icon if available)
  if (guild) {
    const icon = guild.iconURL?.({ size: 64 });
    embed.setAuthor({ name: guild.name, iconURL: icon ?? undefined });
  }

  // Thumbnail (optional)
  if (thumbnail) embed.setThumbnail(thumbnail);
  // Image (optional)
  if (image) embed.setImage(image);

  // Footer (bot tag)
  if (clientUser) {
    embed.setFooter({ text: footerText || clientUser.tag, iconURL: clientUser.displayAvatarURL?.({ size: 64 }) });
  }

  return embed;
}

module.exports = { Colors, baseEmbed };
