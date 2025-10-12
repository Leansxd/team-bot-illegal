const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, Colors } = require('../utils/embeds');
const { getOt } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('envanter')
    .setDescription('Kullanıcının OT istatistiklerini gösterir')
    .addUserOption(o => o.setName('kullanici').setDescription('İsteğe bağlı hedef kullanıcı')),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici') || interaction.user;
    const amount = getOt(user.id);
    const embed = baseEmbed(interaction, {
      title: 'Envanter',
      color: Colors.primary,
      fields: [
        { name: 'Kullanıcı', value: `<@${user.id}>`, inline: true },
        { name: 'OT', value: String(amount), inline: true }
      ]
    });
    await interaction.reply({ embeds: [embed] });
  }
};
