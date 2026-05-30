/** Audio procedural — capa narrativa de sonido. */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.osc = null;
    this.osc2 = null;
    this._footstepTimer = null;
    this.tension = 0.5;
  }

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  async resume() {
    await this.init();
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  stopAmbient() {
    try {
      this.osc?.stop();
      this.osc2?.stop();
    } catch {
      /* noop */
    }
    this.osc = null;
    this.osc2 = null;
    this.ambientGain = null;
  }

  /** tension 0 = calma, 1 = máximo */
  setTensionLevel(level) {
    this.tension = Math.max(0, Math.min(1, level));
    if (this.ambientGain) {
      this.ambientGain.gain.value = 0.03 + this.tension * 0.09;
    }
  }

  startAmbient(mode = "default") {
    this.stopAmbient();
    if (!this.ctx) return;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = mode === "tension" ? 300 : 190;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = mode === "tension" ? 0.08 : 0.05;
    this.osc = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.osc.type = "sawtooth";
    this.osc2.type = "sine";
    this.osc.frequency.value = mode === "tension" ? 54 : 38;
    this.osc2.frequency.value = mode === "tension" ? 56 : 41;
    this.osc.connect(filter);
    this.osc2.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.master);
    this.osc.start();
    this.osc2.start();
    this.tension = mode === "tension" ? 0.7 : 0.35;
  }

  playTone(freq, duration, type = "sine", vol = 0.15) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(this.ctx.currentTime + duration);
  }

  playStep() {
    this.playTone(80 + Math.random() * 40, 0.08, "triangle", 0.1);
  }

  playKnock() {
    this.playTone(120, 0.05, "square", 0.18);
    setTimeout(() => this.playTone(95, 0.04, "square", 0.14), 130);
  }

  playScare() {
    this.playTone(200, 0.15, "sawtooth", 0.22);
    this.playTone(440, 0.08, "sine", 0.12);
  }

  playSuccess() {
    this.playTone(220, 0.35, "sine", 0.09);
    setTimeout(() => this.playTone(330, 0.4, "sine", 0.07), 180);
  }

  startFootstepsLoop(ms = 2400) {
    this.stopFootsteps();
    this._footstepTimer = setInterval(() => {
      if (Math.random() > 0.35) this.playStep();
    }, ms);
  }

  stopFootsteps() {
    if (this._footstepTimer) clearInterval(this._footstepTimer);
    this._footstepTimer = null;
  }
}
