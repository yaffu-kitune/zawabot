const { Monitor } = require('../lib/monitor')

/**
 * @type {Array<[string, import('discord.js').MessageOptions | string]>}
 */
const PATTERN_AND_MESSAGE = [
  ['にゃ～ん', 'にゃ～ん'],
  [
    'BanHummer',
    {
      files: [
        'https://media1.tenor.com/images/b2b8d46c2e6adc8f9a83ac9390e91a0b/tenor.gif',
      ],
    },
  ],
  ['やぁ！', 'しあしざわざわだよ！！'],
  ['へい元部長', 'はいはい、なんでしょい'],
  ['負け', 'それより大富豪で負けました芦沢ですよろしく'],
  ['勝', 'ふざけんなよ！俺の勝ちだ！俺がルール！'],
  ['やったー', 'おれ！平民！いぇーい'],
  ['うざ', 'うざいとか～よくないですよぉ'],
  ['うっざ', 'うざいとか～よくないですよぉ'],
]

module.exports = class extends Monitor {
  constructor() {
    super(Object.values(PATTERN_AND_MESSAGE).map(value => value[0]))
  }

  /**
   * @param {import('discord.js').Message} message
   */
  async run(message) {
    const replyContent = PATTERN_AND_MESSAGE.find(
      value => value[0] === message.content
    )
    if (replyContent && !message.author.bot) return message.reply(replyContent[1])
  }
}