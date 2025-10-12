const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolbilgi')
    .setDescription('Belirtilen roldeki kullanıcıları listeler')
    .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const role = interaction.options.getRole('rol', true);
    await interaction.deferReply();

    const members = await interaction.guild.members.fetch();
    const users = members.filter(m => m.roles.cache.has(role.id) && !m.user.bot).map(m => `${m.user.tag} (${m.id})`);

    if (users.length === 0) return interaction.followUp({ embeds: [new EmbedBuilder().setTitle('Rol Bilgisi').setColor(0x5865f2).setDescription('Bu rolde üye yok.')] });

    const text = users.join('\n');
    if (text.length > 3900) {
      const buf = Buffer.from(text, 'utf8');
      const embed = new EmbedBuilder()
        .setTitle('Rol Bilgisi')
        .setColor(0x5865f2)
        .addFields(
          { name: 'Rol', value: `<@&${role.id}>`, inline: true },
          { name: 'Üye Sayısı', value: String(users.length), inline: true }
        )
        .setFooter({ text: 'Liste çok uzun olduğu için dosya olarak eklendi.' })
        .setTimestamp();
      await interaction.followUp({ embeds: [embed], files: [{ attachment: buf, name: 'rol_kullanicilari.txt' }] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle('Rol Bilgisi')
        .setColor(0x5865f2)
        .addFields(
          { name: 'Rol', value: `<@&${role.id}>`, inline: true },
          { name: 'Üye Sayısı', value: String(users.length), inline: true }
        )
        .setDescription(text)
        .setTimestamp();
      await interaction.followUp({ embeds: [embed] });
    }
  }
};
