/**
 * ある特定のパターンがあるメッセージに対して処理を実行するためのベースクラス
 * @abstract
 */
module.exports.Monitor = class {
    /**
     * @param {RegExp|string|string[]} pattern
     */
    constructor(tntn) {
      /**
       * @type {RegExp|string|string[]}
       * @readonly
       */
      this.pattern = tntn
      

    }
  
    /**
     * @param {import('discord.js').Message} message
     * @abstract
     */
    // eslint-disable-next-line no-unused-vars
    async run(message) {}
  
    /**
     * @param {import('discord.js').Message} message
     * @private
     */
    async _run(message) {
      if (!this._validate(message.content)) return
  
      return this.run(message)
    }
  
    /**
     * patternプロパティを参照して、メッセージコンテンツを検証するメソッド
     * @param {string} content Message Content
     * @private
     */
    _validate(content) {
      if (this.pattern instanceof RegExp) return this.pattern.test(content)
      else if (typeof this.pattern === 'string')
        return content.includes(this.pattern)
      else if (!Array.isArray(this.pattern))
        throw new TypeError(
          'patternはstringまたはstring[]、RegExpのみ許可されています。'
        )
  
      if (!this.pattern.every(value => typeof value === 'string'))
        throw new TypeError('patternは文字列の配列のみ許可されています')
  
      return this.pattern.some(value => content.includes(value))
    }
  }