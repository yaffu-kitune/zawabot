const { Monitor } = require("../lib/monitor");
const { randomInt } = require("../lib/math.js");

const NG =
  /ちんちん|ばか|死|氏ね|きしょ|ばーか|しね|ころす|死ね|殺す|きっしょ|ゴミ|野獣先輩|糞|ヒカキン|HIKAKIN|SEIKIN|カス|MASUO|マスオ|ベタ男/u;

const replyMessages = [
  [
    "696329730315518093",
    [
      "は？",
      "ちん！",
      "あしざわかっこいいね",
      "お前喧嘩売ってる？",
      "雑魚乙たい焼き",
    ],
  ],
  ["635111125230288896", ["そんなこと言わないで(´;ω;｀)", "あしざわばか"]],
  ["351992405831974915", ["そ、そんなぁ.....", "うんこ"]],
  ["428688816497491989", ["おっ今日もエロイね", "Fuck u"]],
  ["501394259413434369", ["おっ今日もエロイね", "FK U"]],
  ["675360928572637195", ["おれ馬鹿じゃないもんねぇぇぇぇだ", "UNKO"]],
  [
    "463001449337716746",
    ["暴言言うなよ〜ん～でもなんか言うことないんだよね", "Pythonゴミ！"],
  ],
];

const etcplus = [
  "ん？",
  "ほ～う？",
  "ぱ～りぃぴ～ぽ～",
  "僕は美しいけどね",
  "よく言われるんだよね。福山雅治に似てるって",
  "イケメンはおれ",
  "おは～よおにぃちゃん",
  "俺の彼女アスナ似",
  "僕の名は",
  "へっ",
  "虚無",
  "推しは僕にしときなよ",
];

module.exports = class extends Monitor {
  constructor() {
    super(NG);
  }

  async run(message) {
    const replyMessage = (replyMessages.find(
      ([id]) => id === message.author.id
    ) || [])[1];

    if (replyMessage && Array.isArray(replyMessage))
      return message.reply(replyMessage[randomInt(0, replyMessage.length - 1)]);
    else return message.reply(etcplus[randomInt(0, etcplus.length - 1)]);
  }
};
