const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { baseEmbed, Colors } = require('../utils/embeds');
const { getActiveEvent, saveActiveEvent } = require('../utils/eventStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('etkinlik_baslat')
    .setDescription('Etkinlik başlatır ve süre sonunda katılanları listeler')
    .addStringOption(o => o.setName('isim').setDescription('Etkinlik adı').setRequired(true))
    .addIntegerOption(o => o.setName('saat').setDescription('Saat'))
    .addIntegerOption(o => o.setName('dakika').setDescription('Dakika'))
    .addIntegerOption(o => o.setName('sure').setDescription('Saniye (eğer saat/dakika verilmezse varsayılan 10)')),
  async execute(interaction) {
    const current = getActiveEvent();
    const now = Date.now();
    if (current && (current.endAt || 0) > now) {
      return interaction.reply({ content: 'Zaten devam eden bir etkinlik var. Mevcut etkinlik bitmeden yenisi başlatılamaz.', ephemeral: true });
    }
    const name = interaction.options.getString('isim', true);
    const hours = interaction.options.getInteger('saat') ?? 0;
    const minutes = interaction.options.getInteger('dakika') ?? 0;
    const secsOpt = interaction.options.getInteger('sure');
    let seconds = (hours * 3600) + (minutes * 60) + (secsOpt ?? 0);
    if (!seconds || seconds <= 0) seconds = 10; // varsayılan

    const fmtDuration = (total) => {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const parts = [];
      if (h) parts.push(`${h} saat`);
      if (m) parts.push(`${m} dakika`);
      if (s || parts.length === 0) parts.push(`${s} saniye`);
      return parts.join(' ');
    };

    const joinBtn = new ButtonBuilder()
      .setCustomId('join_evt')
      .setLabel('Katıl')
      .setStyle(ButtonStyle.Success);
    const listBtn = new ButtonBuilder()
      .setCustomId('list_evt')
      .setLabel('Katılanlar')
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(joinBtn, listBtn);

    const bannerUrl = 'https://media.discordapp.net/attachments/1178298785416355920/1391123731589365896/lspdd.png?ex=6890fbef&is=688faa6f&hm=e97e94bd1112951b631b110ac0cee452463fd63fba6f22529cdb6fe0b762be6e&=&format=webp&quality=lossless&width=1535&height=842';
    const startEmbed = baseEmbed(interaction, {
      title: 'Etkinlik Başladı',
      color: Colors.primary,
      description: `Süre: ${fmtDuration(seconds)}`,
      fields: [
        { name: 'İsim', value: name, inline: true },
        { name: 'Süre', value: fmtDuration(seconds), inline: true }
      ],
      image: bannerUrl,
      footerText: 'Katılmak için aşağıdaki butona tıkla'
    });

    await interaction.reply({
      embeds: [startEmbed],
      components: [row],
      allowedMentions: { parse: [] }
    });

    const msg = await interaction.fetchReply();

    const endAt = Date.now() + (seconds * 1000);
    const evt = {
      name,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      messageId: msg.id,
      bannerUrl,
      endAt,
      participants: []
    };
    saveActiveEvent(evt);

    await interaction.followUp({ content: `Etkinlik başladı ve ${Math.ceil(seconds)} saniye sonra bitecek. Bot yeniden başlasa bile etkinlik devam eder.`, flags: MessageFlags.Ephemeral }).catch(() => {});

    try {
      if (global.tryResumeOrScheduleEvent) global.tryResumeOrScheduleEvent();
    } catch (_) {}
  }
};
