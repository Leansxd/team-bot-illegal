const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kilitac')
    .setDescription('Bulunduğun kanalın kilidini açar')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const channel = interaction.channel;
    const everyone = interaction.guild.roles.everyone;
    try {
      await channel.permissionOverwrites.edit(everyone, { SendMessages: null });
      const embed = new EmbedBuilder()
        .setTitle('Kanal Kilidi Açıldı')
        .setColor(0x57f287)
        .addFields(
          { name: 'Kanal', value: `<#${channel.id}>`, inline: true },
          { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const err = new EmbedBuilder().setTitle('Hata').setColor(0xed4245).setDescription(e.message);
      await interaction.reply({ embeds: [err], flags: MessageFlags.Ephemeral });
    }
  }
};
