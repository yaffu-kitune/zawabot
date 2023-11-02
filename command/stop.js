const { SlashCommandBuilder } = require('discord.js');
const controllerManager = require('../src/lib/controllers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the music'),
  async execute({ client, interaction }) {
    const guildId = interaction.guildId;
    const controller = controllerManager.getController(guildId);

    if (!controller) {
      return interaction.reply('音楽は再生されていません');
    }

    const success = controller.stop(guildId);
    if (success) {
      return interaction.reply({ content: '音楽を停止しました。次の曲に進みます。', ephemeral: true});
    } else {
      return interaction.reply('停止できませんでした');
    }
  },
};
