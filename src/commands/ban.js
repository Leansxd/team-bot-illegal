const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Belirtilen kullanıcıyı (ID veya mention) banlar')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(false))
    .addStringOption(o => o.setName('id').setDescription('Kullanıcı ID'))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const id = interaction.options.getString('id');
    const reason = interaction.options.getString('sebep') || 'Force ban';

    const userId = user?.id || id;
    if (!userId) return interaction.reply({ content: 'Bir kullanıcı ya da ID belirtmelisin.', flags: MessageFlags.Ephemeral });

    try {
      await interaction.guild.members.ban(userId, { reason });
      const embed = new EmbedBuilder()
        .setTitle('Ban Uygulandı')
        .setColor(0xed4245)
        .addFields(
          { name: 'Kullanıcı ID', value: userId, inline: true },
          { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Sebep', value: reason || 'Belirtilmedi', inline: false }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const err = new EmbedBuilder()
        .setTitle('Ban Başarısız')
        .setColor(0xffa500)
        .setDescription(`Hata: ${e.message}`);
      await interaction.reply({ embeds: [err], flags: MessageFlags.Ephemeral });
    }
  }
};
