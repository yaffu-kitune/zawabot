const { SlashCommandBuilder } = require("discord.js");
const play = require("play-dl");
const controllerManager = require("../src/lib/controllers.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays music in your voice channel.")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("The URL of the YouTube video or playlist")
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName("shuffle")
        .setDescription("Turn on shuffle for playlist playback")
        .setRequired(false)
    ),
  async execute({ client, interaction }) {
    const url = interaction.options.getString("url");
    const shuffle = interaction.options.getBoolean("shuffle") || false;
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply("ボイスチャンネルに入ってから呼んでね");
    }

    const controller = controllerManager.getController(interaction.guild.id);
    await interaction.deferReply({ ephemeral: true });

    try {
      if (play.yt_validate(url) === "playlist") {
        await controller.handlePlaylist(url, interaction, voiceChannel, shuffle);
        await interaction.editReply("プレイリストをキューに追加しました！");
      } else {
        const videoInfo = await play.video_info(url).catch(error => {
          console.error(error);
          interaction.editReply("動画情報の取得に失敗しました。URLが正しいか確認してください。");
        });
        if (!videoInfo) return;
        
        const thumbnail = videoInfo.video_details.thumbnails[0]?.url || 'デフォルトのサムネイルURL';
        const songDetails = {
          title: videoInfo.video_details.title,
          url: videoInfo.video_details.url,
          duration: videoInfo.video_details.durationInSec,
          thumbnail,
        };
        controller.queue.add(songDetails);

        if (!controller.queue.playing) {
          await controller.playSong(interaction.guild, voiceChannel);
          interaction.editReply(`今再生中: [**${songDetails.title}**](${songDetails.url})`);
        } else {
          interaction.editReply(`キューに追加しました: [**${songDetails.title}**](${songDetails.url})`);
        }
      }
    } catch (error) {
      console.error(error);
      interaction.editReply("エラーが発生しました。");
    }
  },
};
