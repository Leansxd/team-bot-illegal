const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { baseEmbed, Colors } = require('../utils/embeds');
const { addOt, getOt } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('otekkle')
    .setDescription('Belirtilen kullanıcıya OT ekler')
    .addUserOption(o => o.setName('kullanici').setDescription('Hedef kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('miktar').setDescription('Eklenecek miktar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici', true);
    const amount = interaction.options.getInteger('miktar', true);
    if (amount <= 0) return interaction.reply({ embeds: [baseEmbed(interaction, { title: 'Geçersiz Miktar', color: Colors.danger, description: 'Miktar pozitif olmalı.' })], flags: MessageFlags.Ephemeral });

    addOt(user.id, amount);
    const newTotal = getOt(user.id);
    const embed = baseEmbed(interaction, {
      title: 'Ot Ekleme',
      color: Colors.success,
      fields: [
        { name: 'Kullanıcı', value: `<@${user.id}>`, inline: true },
        { name: 'Miktar', value: String(amount), inline: true },
        { name: 'Yeni Toplam', value: String(newTotal), inline: true },
        { name: 'Yetkili', value: `<@${interaction.user.id}>`, inline: true }
      ]
    });
    await interaction.reply({ embeds: [embed] });
  }
};
