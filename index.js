const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require('path');
require("./registar.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const { GreetingMonitor, NG, osuz } = require("./src/index.js");
const monitors = [new GreetingMonitor(), new NG(), new osuz()];
client.on("messageCreate", async (message) => {
  
  if (message.content === "!ping") {
    message.reply("Pong!");
  }

  const files = (
    await Promise.all(
      message.attachments
        .filter((it) => it.name.endsWith(".osz") ?? false)
        .map((it) => axios.get(it.url, { responseType: "arraybuffer" }))
    )
  )
    .map((it) => new AdmZip(Buffer.from(it.data)))
    .map((it) => it.readFile("audio.mp3"))
    .filter((it) => Buffer.isBuffer(it))
    .map((it) => new AttachmentBuilder(it, { name: "audio.mp3" }));

  if (files.length) await message.reply({ content: "音声データだよ", files });

  Promise.all([monitors.map((monitor) => monitor._run(message))].flat()).catch(
    console.error
  );
});

client.commands = new Collection();
client.controllers = new Map();


const commandsPath = path.join(__dirname, 'command');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute({ client, interaction }); // player を渡す
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});


client.login(process.env.TOKEN).catch(console.error);
