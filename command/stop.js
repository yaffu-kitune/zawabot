const { SlashCommandBuilder } = require('discord.js');
const controllerManager = require('../src/lib/controllers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the music and plays the next song, if available.'),
  async execute({ client, interaction }) {
    const guildId = interaction.guildId;
    const controller = controllerManager.getController(guildId);

    if (!controller) {
      return interaction.reply('音楽は再生されていません。');
    }

    const success = controller.stop();
    if (success) {
      return interaction.reply({ content: '音楽を停止しました。次の曲に進みます。',  });
    } else {
      return interaction.reply({ contact:'停止できませんでした。', ephemeral: true});
    }
  },
};
