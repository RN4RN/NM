/**
 * Sincroniza el parpadeo del jugador con la pantalla de la historia.
 */

import { EV } from "./events.js";

export class BlinkSync {
  constructor(hub, sceneLayer) {
    this.hub = hub;
    this.sceneLayer = sceneLayer;
    this.enabled = true;
    this.unsubs = [];
  }

  start() {
    this.stop();
    this.unsubs.push(
      this.hub.events.on(EV.EYES_CLOSED, () => this.setClosed(true)),
      this.hub.events.on(EV.EYES_OPENED, () => this.setClosed(false)),
      this.hub.events.on(EV.FACE_LOST, () => this.setClosed(false)),
    );
  }

  stop() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.setClosed(false);
  }

  setClosed(closed) {
    if (!this.enabled || !this.sceneLayer) return;
    this.sceneLayer.classList.toggle("eyes-closed", closed);
    document.body.classList.toggle("player-blinking", closed);
  }
}
