const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { baseEmbed, Colors } = require('../utils/embeds');
const { topOt } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('siralama')
    .setDescription('En fazla OT kasan ilk N kişi')
    .addIntegerOption(o => o.setName('adet').setDescription('Kaç kişi gösterilsin (varsayılan 10)')),
  async execute(interaction) {
    const n = interaction.options.getInteger('adet') ?? 10;
    const rows = topOt(Math.max(1, Math.min(50, n)));

    if (rows.length === 0) return interaction.reply({ embeds: [baseEmbed(interaction, { title: 'OT Sıralaması', color: Colors.primary, description: 'Kayıt yok.' })], flags: MessageFlags.Ephemeral });

    const list = rows.map((r, i) => `${i + 1}. <@${r.user_id}> - **${r.amount}** OT`).join('\n');
    const embed = baseEmbed(interaction, {
      title: 'Ot Sıralaması',
      color: Colors.primary,
      description: list
    });
    await interaction.reply({ embeds: [embed] });
  }
};
