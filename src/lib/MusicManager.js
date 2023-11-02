const play = require("play-dl");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");

class MusicQueue {
  constructor() {
    this.queue = [];
    this.playing = false;
    this.connection = null;
  }

  add(song) {
    this.queue.push(song);
  }

  next() {
    return this.queue.shift();
  }
}

class MusicController {
  constructor() {
    this.queue = new MusicQueue();
    this.audioPlayer = null;
    this.currentGuild = null;
    this.currentVoiceChannel = null;
  }

  async handlePlaylist(url, interaction, voiceChannel, shuffle) {
    const playlistInfo = await play.playlist_info(url);
    let songs = await Promise.all(
      playlistInfo.videos.map(async (video) => {
        const videoInfo = await play.video_info(video.url);
        return {
          title: videoInfo.video_details.title,
          url: videoInfo.video_details.url,
          duration: videoInfo.video_details.durationInSec,
          thumbnail:
            videoInfo.video_details.thumbnails[0]?.url ||
            "デフォルトのサムネイルURL",
        };
      })
    );

    if (shuffle) {
      songs = this.shuffleArray(songs);
    }

    for (const song of songs) {
      this.queue.add(song);
    }

    if (!this.queue.playing) {
      await this.playSong(interaction.guild, voiceChannel);
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // 再生するメソッド playSong を追加
  async playSong(guild, voiceChannel) {
    // guild と voiceChannel を保存
    this.currentGuild = guild;
    this.currentVoiceChannel = voiceChannel;

    const song = this.queue.next();
    if (!song) {
      this.queue.playing = false;
      this.closeConnectionAfterTimeout(guild.id, 30 * 1000);
      return;
    }

    let connection = getVoiceConnection(guild.id);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });
    }

    try {
      const stream = await play.stream(song.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });
      const player = createAudioPlayer();
      this.audioPlayer = player;

      connection.subscribe(player);
      const subscription = connection.subscribe(player);
      if (!subscription) {
        console.error("Failed to subscribe to the voice connection");
        return;
      }
      player.play(resource);
      this.queue.playing = true;

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("The audio is now playing!");
      });

      player.on(AudioPlayerStatus.Idle, () => {
        this.queue.playing = false;
        this.playNext().catch((error) => {
          console.error(error);
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  stop() {
    if (!this.currentGuild) {
      console.log("ボイスチャンネルに接続していません");
      return false;
    }

    const connection = getVoiceConnection(this.currentGuild.id);
    if (!connection) {
      console.log("ボイスチャンネルに接続していません");
      return false;
    }

    const dispatcher = connection.state.subscription?.player;
    if (!dispatcher) {
      console.log("再生中のトラックはありません");
      return false;
    }

    if (this.queue.queue.length > 0) {
      this.queue.next();
      this.playNext();
      console.log("次の曲に進みました");
    } else {
      this.queue.queue = [];
      dispatcher.stop();
      connection.destroy();
      this.queue.playing = false;
      console.log("再生を停止しました");
    }
    return true;
  }

  async playNext() {
    const nextSong = this.queue.next();
    if (nextSong) {
      await this.playSong(this.currentGuild, this.currentVoiceChannel);
    } else {
      this.queue.playing = false;
      console.log("キューが空です。再生を停止しました");
    }
  }

  closeConnectionAfterTimeout(guildId, timeout) {
    setTimeout(() => {
      const connection = getVoiceConnection(guildId);
      if (connection && !this.queue.playing && this.queue.queue.length === 0) {
        connection.destroy();
        console.log("接続がクローズされました");
      }
    }, timeout);
  }
}

module.exports = {
  MusicController,
  MusicQueue,
};
