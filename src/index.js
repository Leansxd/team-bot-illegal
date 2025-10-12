const { Client, GatewayIntentBits, Partials, Collection, Events, PermissionsBitField, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { ensureDb } = require('./utils/db');
const { baseEmbed, Colors } = require('./utils/embeds');
const { getActiveEvent, saveActiveEvent, clearEvent, addParticipant } = require('./utils/eventStore');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

process.on('unhandledRejection', (reason, p) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('warning', (w) => {
  console.warn('[process warning]', w);
});
client.on('error', (e) => console.error('[client error]', e));
client.on('shardError', (e) => console.error('[shard error]', e));
client.on('shardDisconnect', (event, shardId) => console.warn(`[shard disconnect] shard=${shardId}`, event?.code));
client.on('shardReconnecting', (shardId) => console.warn(`[shard reconnecting] shard=${shardId}`));
client.on('warn', (m) => console.warn('[client warn]', m));

const ENABLE_DEBUG = process.env.DEBUG_DISCORD === '1';
if (ENABLE_DEBUG) {
  client.on('debug', (m) => console.log('[client debug]', m));
}

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.js')) continue;
  const cmd = require(path.join(commandsPath, file));
  if (cmd && cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
  }
}

ensureDb();

client.once(Events.ClientReady, (c) => {
  console.log(`Bot giriş yaptı: ${c.user.tag}`);
  try {
    c.user.setPresence({
      activities: [{ name: 'LAUREX #𝐊𝐈𝐍𝐆𝐃𝐎𝐌' }],
      status: 'online'
    });
  } catch (e) {
    console.error('Presence ayarlanamadı:', e);
  }

  const guildId = process.env.GUILD_ID;
  const voiceChannelId = process.env.VOICE_CHANNEL_ID;
  if (guildId && voiceChannelId) {
    connectToVoiceChannel(guildId, voiceChannelId).catch(err => console.error('Ses kanalına bağlanılamadı:', err));
  } else {
    console.warn('VOICE_CHANNEL_ID .env dosyasında tanımlı değil. Ses kanalına otomatik bağlanma atlandı.');
  }

  tryResumeOrScheduleEvent();
});

let voiceConnection = null;
async function connectToVoiceChannel(guildId, channelId) {
  const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) throw new Error('Guild bulunamadı');
  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || (channel.type !== 2 && channel.type !== 13)) throw new Error('Ses/Stage kanalı bulunamadı');

  voiceConnection?.destroy();
  voiceConnection = joinVoiceChannel({
    channelId,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false
  });
  try {
    voiceConnection.on('stateChange', (oldState, newState) => {
      console.log(`[voice] ${oldState.status} -> ${newState.status}`);
    });
  } catch (_) {}
  try {
    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 20_000);
    console.log('Ses kanalına bağlanıldı.');
  } catch (e) {
    console.error('Ses bağlantısı hazır hale gelmedi:', e);
  }
}

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  try {
    const me = newState.guild.members.me;
    if (!me) return;
    const shouldBeIn = process.env.VOICE_CHANNEL_ID;
    if (!shouldBeIn) return;
    const before = oldState.member?.id === me.id ? oldState.channelId : null;
    const after = newState.member?.id === me.id ? newState.channelId : null;
    if ((before && !after) || (after && after !== shouldBeIn)) {
      connectToVoiceChannel(newState.guild.id, shouldBeIn).catch(() => {});
    }
  } catch (_) {}
});

let finalizeTimer = null;

function tryResumeOrScheduleEvent() {
  const evt = getActiveEvent();
  if (!evt) return;
  const now = Date.now();
  const remaining = (evt.endAt || 0) - now;
  if (remaining <= 0) {
    finalizeEvent().catch(e => console.error('Etkinlik bitirme hatası:', e));
  } else {
    if (finalizeTimer) clearTimeout(finalizeTimer);
    finalizeTimer = setTimeout(() => finalizeEvent().catch(e => console.error('Etkinlik bitirme hatası:', e)), remaining);
    console.log(`Aktif etkinlik bulundu. ${Math.ceil(remaining/1000)} sn sonra bitecek.`);
  }
}
global.tryResumeOrScheduleEvent = tryResumeOrScheduleEvent;

async function finalizeEvent() {
  const evt = getActiveEvent();
  if (!evt) return;
  const { guildId, channelId, messageId, name, bannerUrl } = evt;
  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId).catch(() => null);

    const participants = Array.isArray(evt.participants) ? evt.participants : [];
    const list = participants.map((id, idx) => `${idx + 1}. <@${id}>`).join('\n');

    // DM özetleri
    let dmOk = 0, dmFail = 0;
    for (const id of participants) {
      try {
        const user = await client.users.fetch(id);
        const dmEmbed = baseEmbed({ guild }, {
          title: 'Etkinlik Katılım Bilgisi',
          color: Colors.info,
          description: `<@${id}> merhaba! ${guild.name} sunucusunda "${name}" etkinliğine katıldın.`,
          fields: [
            { name: 'Etkinlik', value: name, inline: true },
            { name: 'Sunucu', value: guild.name, inline: true },
            { name: 'Katılımcı Sayısı', value: String(participants.length), inline: true }
          ]
        });
        await user.send({ embeds: [dmEmbed] });
        dmOk++;
        await new Promise(r => setTimeout(r, 300));
      } catch (_) { dmFail++; }
    }

    const endEmbed = baseEmbed({ guild }, {
      title: 'Etkinlik Sonuçları',
      color: Colors.success,
      description: (list && list.length ? list : 'Kimse katılmadı.') + '\n\nKatıldığınız için teşekkürler! Katılımcılar yukarıda listelenmiştir.',
      fields: [
        { name: 'İsim', value: name, inline: true },
        { name: 'Katılımcı Sayısı', value: String(participants.length), inline: true }
      ],
      image: bannerUrl
    });

    await channel.send({ embeds: [endEmbed] });
    if (msg) await msg.edit({ components: [] }).catch(() => {});
  } catch (e) {
    console.error('Etkinlik sonuç gönderimi hatası:', e);
  } finally {
    clearEvent();
    if (finalizeTimer) { clearTimeout(finalizeTimer); finalizeTimer = null; }
  }
}

// (bot restart sonrası da çalışır)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  const evt = getActiveEvent();
  if (!evt) return interaction.reply({ content: 'Aktif bir etkinlik yok.', flags: MessageFlags.Ephemeral }).catch(() => {});
  if (interaction.message?.id !== evt.messageId) {
    return interaction.reply({ content: 'Bu buton artık geçersiz.', flags: MessageFlags.Ephemeral }).catch(() => {});
  }
  if (interaction.customId === 'join_evt') {
    const added = addParticipant(interaction.user.id);
    const content = added ? 'Katılımın alındı!' : 'Zaten katılmışsın.';
    await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
    // DM onayı
    try {
      const user = await client.users.fetch(interaction.user.id);
      const dmEmbed = baseEmbed(interaction, {
        title: 'Etkinlik Katılım Onayı',
        color: Colors.info,
        description: `${interaction.guild?.name || 'Sunucu'} sunucusundaki "${evt.name}" etkinliğine katılımın alındı. Sonuçlar açıklandığında tekrar bilgilendirileceksin.`,
        fields: [
          { name: 'Etkinlik', value: evt.name, inline: true },
          { name: 'Sunucu', value: interaction.guild?.name || 'Sunucu', inline: true }
        ]
      });
      await user.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}
    return;
  }
  if (interaction.customId === 'list_evt') {
    const participants = (getActiveEvent()?.participants) || [];
    const listStr = participants.length
      ? participants.map((id, idx) => `${idx + 1}. <@${id}>`).join('\n')
      : 'Henüz katılan yok.';
    const content = listStr.length > 1900 ? listStr.slice(0, 1900) + '...' : listStr;
    return interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
  }
});

// Autorol
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const roleId = process.env.AUTOROLE_ID;
    if (!roleId) return;
    const role = member.guild.roles.cache.get(roleId) || await member.guild.roles.fetch(roleId).catch(() => null);
    if (role) await member.roles.add(role, 'Autorol');
  } catch (e) {
    console.error('Autorol hatası:', e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const roleIdsRaw = process.env.AUTH_ROLE_IDS;
  const roleIds = roleIdsRaw ? roleIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const singleRoleId = process.env.AUTH_ROLE_ID;
  const authUserId = process.env.AUTH_USER_ID;

  let authorized = false;
  if (interaction.inGuild()) {
    const member = interaction.member; 
    if (roleIds.length > 0) {
      authorized = roleIds.some(id => member?.roles?.cache?.has(id));
    } else if (singleRoleId) {
      authorized = !!member?.roles?.cache?.has(singleRoleId);
    }
  }
  if (!authorized && authUserId) {
    authorized = interaction.user.id === authUserId;
  }
  if (!authorized) {
    const configured = (roleIds.length > 0) || singleRoleId || authUserId;
    const reason = configured
      ? 'Bu komutu kullanmak için yetkin yok.'
      : 'Konfigürasyon eksik: AUTH_ROLE_IDS, AUTH_ROLE_ID veya AUTH_USER_ID tanımlı değil.';
    return interaction.reply({ content: reason, flags: MessageFlags.Ephemeral });
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'Komut çalıştırılırken bir hata oluştu.', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu.', flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
