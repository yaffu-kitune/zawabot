// controllers.js
const { MusicController } = require("./MusicManager.js");

class ControllerManager {
  constructor() {
    this.controllers = new Map();
  }

  getController(guildId) {
    if (!this.controllers.has(guildId)) {
      this.controllers.set(guildId, new MusicController());
    }
    return this.controllers.get(guildId);
  }
}

const controllerManager = new ControllerManager();
module.exports = controllerManager;
