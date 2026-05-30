/**
 * Boca — sonrisa y boca abierta (landmarks + blendshapes).
 */

export class MouthTracker {
  constructor(faceTracker) {
    this.face = faceTracker;
    this.smileTime = 0;
    this.closedTime = 0;
    this._wasSmiling = false;
    this._wasOpen = false;
  }

  _blend(name) {
    return this.face.getBlendshapes().find((c) => c.categoryName === name)?.score ?? 0;
  }

  _mouthOpenRatio(face) {
    const top = face[13];
    const bottom = face[14];
    const left = face[61];
    const right = face[291];
    const open = Math.hypot(top.x - bottom.x, top.y - bottom.y);
    const width = Math.hypot(left.x - right.x, left.y - right.y) || 0.001;
    return open / width;
  }

  _smileRatio(face) {
    const left = face[61];
    const right = face[291];
    const top = face[0];
    const width = Math.hypot(left.x - right.x, left.y - right.y) || 0.001;
    const lift = ((left.y + right.y) / 2 - top.y) * 0.5;
    return lift / width;
  }

  analyze(dt = 0) {
    const face = this.face.getFace();
    if (!face) {
      return {
        smiling: false,
        mouthOpen: false,
        smileTime: 0,
        closedTime: 0,
        confidence: 0,
        message: "Rostro no visible",
      };
    }

    const smileBlend = (this._blend("mouthSmileLeft") + this._blend("mouthSmileRight")) / 2;
    const jawOpen = this._blend("jawOpen");
    const ratio = this._mouthOpenRatio(face);
    const smileGeo = this._smileRatio(face);

    const smiling = smileBlend > 0.38 || smileGeo > 0.018;
    const mouthOpen = jawOpen > 0.25 || ratio > 0.065;

    if (smiling) {
      this.smileTime += dt;
      if (!this._wasSmiling) this._wasSmiling = true;
    } else {
      this.smileTime = Math.max(0, this.smileTime - dt * 0.35);
      this._wasSmiling = false;
    }

    if (!mouthOpen) {
      this.closedTime += dt;
    } else {
      this.closedTime = Math.max(0, this.closedTime - dt * 0.5);
    }

    if (mouthOpen && !this._wasOpen) this._wasOpen = true;
    if (!mouthOpen) this._wasOpen = false;

    const confidence = Math.min(1, this.smileTime / 4);

    return {
      smiling,
      mouthOpen,
      smileTime: this.smileTime,
      closedTime: this.closedTime,
      confidence,
      smileBlend,
      jawOpen,
      message: smiling ? "Sonrisa detectada" : mouthOpen ? "Cierra la boca…" : "Expresión neutra",
    };
  }

  reset() {
    this.smileTime = 0;
    this.closedTime = 0;
    this._wasSmiling = false;
    this._wasOpen = false;
  }
}
