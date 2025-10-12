const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.js')) continue;
  const command = require(path.join(commandsPath, file));
  if (command?.data) commands.push(command.data.toJSON());
}

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID;
  const clientId = (process.env.CLIENT_ID) || '';

  if (!token || !guildId) {
    console.error('DISCORD_TOKEN ve GUILD_ID .env içinde tanımlı olmalı.');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log('Slash komutları deploy ediliyor...');
    await rest.put(Routes.applicationGuildCommands(clientId || (await getAppId(rest)).id, guildId), { body: commands });
    console.log('Bitti.');
  } catch (e) {
    console.error(e);
  }
}

async function getAppId(rest) {
  return await rest.get(Routes.oauth2CurrentApplication());
}

main();
