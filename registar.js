const { REST, Routes } = require("discord.js");
const dotenv = require("dotenv");
const fs = require('node:fs');
const path = require('node:path');

dotenv.config();

const commands = [];

// commandsディレクトリのファイルを全取得
const foldersPath = path.join(__dirname, 'command');
const commandFiles = fs.readdirSync(foldersPath);

for (const file of commandFiles) {
    const commandsPath = path.join(foldersPath, file);
    if (file.endsWith('.js') && fs.statSync(commandsPath).isFile()) {
        const command = require(commandsPath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${commandsPath} is missing a required "data" or "execute" property.`);
        }
    } else if (fs.statSync(commandsPath).isDirectory()) {
        // If you have subdirectories inside "command" and you want to load .js files from them too
        const subCommandFiles = fs.readdirSync(commandsPath).filter(subFile => subFile.endsWith('.js'));
        for (const subFile of subCommandFiles) {
            const subFilePath = path.join(commandsPath, subFile);
            const subCommand = require(subFilePath);
            if ('data' in subCommand && 'execute' in subCommand) {
                commands.push(subCommand.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${subFilePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}


const rest = new REST().setToken(process.env.TOKEN);

// コマンドをdiscordサーバに登録
(async () => {
  try {
    console.log("スラッシュコマンド登録");
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands }
    );
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();