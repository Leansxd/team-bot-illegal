const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { baseEmbed, Colors } = require('../utils/embeds');
const { removeOt } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('otsil')
    .setDescription('Belirtilen kullanıcıdan Ot siler')
    .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('miktar').setDescription('Silinecek miktar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici', true);
    const amount = interaction.options.getInteger('miktar', true);
    if (amount <= 0) return interaction.reply({ embeds: [baseEmbed(interaction, { title: 'Geçersiz Miktar', color: Colors.danger, description: 'Miktar pozitif olmalı.' })], flags: MessageFlags.Ephemeral });

    removeOt(user.id, amount);
    const embed = baseEmbed(interaction, {
      title: 'Ot Silme',
      color: Colors.danger,
      fields: [
        { name: 'Kullanıcı', value: `<@${user.id}>`, inline: true },
        { name: 'Miktar', value: String(amount), inline: true },
        { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true }
      ]
    });
    await interaction.reply({ embeds: [embed] });
  }
};
