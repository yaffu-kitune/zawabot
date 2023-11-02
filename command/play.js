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
      await interaction.deferReply({ ephemeral: true }).catch(console.error);

      await interaction.editReply("応答を開始します...").catch(console.error);
      const controller = controllerManager.getController(interaction.guild.id);
  
      // ここで応答を保留することができます
  
      try {
        if (play.yt_validate(url) === "playlist") {
          await controller.handlePlaylist(url, interaction, voiceChannel, shuffle)
            .then(() => interaction.editReply("プレイリストをキューに追加しました！"))
            .catch((error) => {
              console.error(error);
              interaction.editReply("プレイリストの処理中にエラーが発生しました。");
            });
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
      await interaction.editReply("プレイリストをキューに追加しました！").catch(console.error);
    } catch (error) {
      console.error(error);
      await interaction.followUp({ content: "エラーが発生しました。", ephemeral: true }).catch(console.error);
    }
  },
};
