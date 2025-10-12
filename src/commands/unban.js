const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Banı açar (kullanıcı ID gerek)')
    .addStringOption(o => o.setName('id').setDescription('Kullanıcı ID').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const id = interaction.options.getString('id', true);
    try {
      await interaction.guild.members.unban(id);
      const embed = new EmbedBuilder()
        .setTitle('Ban Kaldırıldı')
        .setColor(0x57f287)
        .addFields(
          { name: 'Kullanıcı ID', value: id, inline: true },
          { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const err = new EmbedBuilder()
        .setTitle('Unban Başarısız')
        .setColor(0xffa500)
        .setDescription(`Hata: ${e.message}`);
      await interaction.reply({ embeds: [err], flags: MessageFlags.Ephemeral });
    }
  }
};
