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
    console.log(
      `曲が追加されました: ${song.title}, キューの長さ: ${this.queue.length}`
    );
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
    console.log("プレイリスト情報の取得を開始...");
    const playlist = await play
      .playlist_info(url, { incomplete: true })
      .catch(console.error);
    if (!playlist) {
      console.log("プレイリスト情報が取得できませんでした。");
      return;
    }

    let songs = [];
    let videoArray = playlist.videos; // すでに取得されたビデオの配列を使用

    for (const video of videoArray) {
      let videoInfo = await play.video_info(video.url).catch(console.error);
      if (!videoInfo) continue; // video_infoが取得できない場合はスキップ
      songs.push({
        title: videoInfo.video_details.title,
        url: videoInfo.video_details.url,
        duration: videoInfo.video_details.durationInSec,
        thumbnail:
          videoInfo.video_details.thumbnails[0]?.url ||
          "デフォルトのサムネイルURL",
      });
    }

    // シャッフルオプションが有効な場合はシャッフルを適用
    if (shuffle) {
      songs = this.shuffleArray(songs);
    }

    // キューに曲を追加
    for (const song of songs) {
      this.queue.add(song);
      console.log(`キューに追加された後のサイズ: ${this.queue.queue.length}`);
    }
    console.log(`追加される曲の数: ${songs.length}`);

    // 再生を開始
    if (!this.queue.playing) {
      await this.playSong(interaction.guild, voiceChannel);
    }
  }

  currentSong() {
    

    if (this.isPlaying && this.queue.length > 0) {
      return this.queue[0]; // 仮にキューの最初の曲が現在再生中とする
    } else {
      console.log("再生中の曲はありません。");
      return null;
    }
  }

  insertSong(song, position) {
    // 位置がキューの範囲内であるか確認し、適切な位置に挿入
    if (position < 0) {
      position = 0;
    } else if (position > this.queue.queue.length) {
      position = this.queue.queue.length;
    }
    this.queue.queue.splice(position, 0, song);
    console.log(
      `曲が挿入されました: ${song.title}, キューの長さ: ${this.queue.queue.length}`
    );
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
      console.log(`Streaming URL: ${song.url}`);
      const stream = await play.stream(song.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });
      const player = createAudioPlayer();
      this.audioPlayer = player;

      player.on("error", (error) => {
        console.error(`Error occurred in the audio player: ${error.message}`);
        this.playNext().catch(console.error);
      });

      connection.subscribe(player);
      player.play(resource);
      this.queue.playing = true;

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("The audio is now playing!");
      });

      player.on(AudioPlayerStatus.Idle, () => {
        this.queue.playing = false;
        this.playNext().catch(console.error);
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

    dispatcher.stop(); // 現在の曲を停止する

    return true;
  }

  async playNext() {
    if (this.queue.queue.length > 0) {
      await this.playSong(this.currentGuild, this.currentVoiceChannel);
    } else {
      this.queue.playing = false;
      console.log("キューが空です。再生を停止しました");
      this.closeConnectionAfterTimeout(this.currentGuild.id, 30 * 1000);
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
