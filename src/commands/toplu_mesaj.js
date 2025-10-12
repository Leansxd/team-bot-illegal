const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toplu_mesaj')
    .setDescription('Belirtilen roldeki herkese DM gönderir')
    .addRoleOption(o => o.setName('rol').setDescription('Hedef rol').setRequired(true))
    .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek mesaj').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const role = interaction.options.getRole('rol', true);
    const message = interaction.options.getString('mesaj', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const members = await interaction.guild.members.fetch();
    const targets = members.filter(m => m.roles.cache.has(role.id) && !m.user.bot);

    let ok = 0, fail = 0;
    for (const [, member] of targets) {
      try {
        await member.send({ content: message });
        ok++;
        await new Promise(r => setTimeout(r, 500)); // basit rate-limit
      } catch (_) {
        fail++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('Toplu Mesaj Raporu')
      .setColor(fail > 0 ? 0xffa500 : 0x57f287)
      .setDescription(`Hedef rol: <@&${role.id}>`)
      .addFields(
        { name: 'Başarıyla Gönderilen', value: String(ok), inline: true },
        { name: 'Başarısız', value: String(fail), inline: true },
        { name: 'Toplam Hedef', value: String(targets.size), inline: true },
      )
      .setTimestamp();

    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
