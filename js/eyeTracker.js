/**

 * Ojos — EAR + blendshapes de parpadeo (sensibilidad configurable).

 */



import { loadSettings, sensitivityToThresholds } from "./settings.js";



export class EyeTracker {

  constructor(faceTracker) {

    this.face = faceTracker;

    this.closedTime = 0;

    this.openTime = 0;

    this.blinkCount = 0;

    this._wasClosed = false;

    this._settings = loadSettings();

    this.applySensitivity(this._settings.blinkSensitivity);

  }



  applySensitivity(value) {

    const { blinkThreshold, earThreshold } = sensitivityToThresholds(value);

    this.blinkThreshold = blinkThreshold;

    this.earThreshold = earThreshold;

    this.sensitivity = value;

  }



  _ear(face, top, bottom, outer, inner) {

    const v = Math.hypot(face[top].x - face[bottom].x, face[top].y - face[bottom].y);

    const h = Math.hypot(face[outer].x - face[inner].x, face[outer].y - face[inner].y) || 0.001;

    return v / h;

  }



  _blend(name) {

    return this.face.getBlendshapes().find((c) => c.categoryName === name)?.score ?? 0;

  }



  analyze(dt = 0) {

    const face = this.face.getFace();

    if (!face) {

      this.closedTime = 0;

      return {

        open: false,

        ear: 0,

        blink: 0,

        closedTime: 0,

        message: "Rostro no visible",

        blinkCount: this.blinkCount,

        sensitivity: this.sensitivity,

      };

    }



    const blink = (this._blend("eyeBlinkLeft") + this._blend("eyeBlinkRight")) / 2;

    const ear = (this._ear(face, 159, 145, 33, 133) + this._ear(face, 386, 374, 362, 263)) / 2;

    const closed = blink > this.blinkThreshold || ear < this.earThreshold;



    if (closed) {

      this.closedTime += dt;

      this.openTime = 0;

      if (!this._wasClosed) this.blinkCount += 1;

      this._wasClosed = true;

    } else {

      this.openTime += dt;

      this.closedTime = Math.max(0, this.closedTime - dt * 0.4);

      this._wasClosed = false;

    }



    return {

      open: !closed,

      ear,

      blink,

      closedTime: this.closedTime,

      openTime: this.openTime,

      blinkCount: this.blinkCount,

      sensitivity: this.sensitivity,

      blinkThreshold: this.blinkThreshold,

      earThreshold: this.earThreshold,

      message: closed ? "¡Parpadeo detectado!" : "Ojos abiertos",

    };

  }



  reset() {

    this.closedTime = 0;

    this.openTime = 0;

    this.blinkCount = 0;

    this._wasClosed = false;

  }

}


