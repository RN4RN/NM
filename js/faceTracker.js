/**
 * Rostro — landmarks, orientación de cabeza y visibilidad.
 */

import { FilesetResolver, FaceLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

export class FaceTracker {
  constructor(video) {
    this.video = video;
    this.landmarker = null;
    this.running = false;
    this.mirror = true;
    this.lastVideoTime = -1;
    this.lastResults = { faceLandmarks: [], faceBlendshapes: [] };
    this.headStability = { samples: [], anchor: null };
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks(WASM);
    const opts = {
      baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
    };
    try {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, opts);
    } catch {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...opts,
        baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
      });
    }
  }

  setRunning(on) {
    this.running = on;
  }

  detect(now) {
    if (!this.running || !this.landmarker || this.video.readyState < 2) return this.lastResults;
    if (this.video.currentTime === this.lastVideoTime) return this.lastResults;
    this.lastVideoTime = this.video.currentTime;
    this.lastResults = this.landmarker.detectForVideo(this.video, now);
    return this.lastResults;
  }

  getFace() {
    return this.lastResults.faceLandmarks?.[0] ?? null;
  }

  getBlendshapes() {
    return this.lastResults.faceBlendshapes?.[0]?.categories ?? [];
  }

  isVisible() {
    return !!this.getFace();
  }

  getNose(w, h) {
    const f = this.getFace();
    if (!f) return null;
    const n = f[1];
    let x = n.x * w;
    const y = n.y * h;
    if (this.mirror) x = w - x;
    return { x, y };
  }

  /** Yaw aproximado: negativo = mira izquierda, positivo = derecha */
  getHeadYaw() {
    const f = this.getFace();
    if (!f) return 0;
    const nose = f[1];
    const left = f[234];
    const right = f[454];
    const faceW = Math.hypot(right.x - left.x, right.y - left.y) || 0.001;
    const toLeft = Math.hypot(nose.x - left.x, nose.y - left.y);
    const toRight = Math.hypot(nose.x - right.x, nose.y - right.y);
    return (toRight - toLeft) / faceW;
  }

  /** ¿Mira hacia la amenaza (centro-derecha de pantalla / cámara)? */
  isLookingAtThreat(threshold = -0.08) {
    const yaw = this.getHeadYaw();
    return Math.abs(yaw) < 0.22 || yaw > threshold;
  }

  /** Mirada aproximada con orientación de cabeza */
  isLookingToward(normX, normY, margin = 0.28) {
    if (!this.isVisible()) return false;
    let gazeX = 0.5 + this.getHeadYaw() * 1.4;
    if (this.mirror) gazeX = 1 - gazeX;
    const f = this.getFace();
    const browY = (f[10].y + f[338].y) / 2;
    const chinY = f[152].y;
    const span = chinY - browY || 0.001;
    const gazeY = 0.5 + ((f[1].y - (browY + chinY) / 2) / span) * 0.65;
    return Math.hypot(gazeX - normX, gazeY - normY) < margin;
  }

  trackHeadStability(w, h) {
    const p = this.getNose(w, h);
    if (!p) {
      this.headStability = { samples: [], anchor: null };
      return { stable: false, delta: 999, visible: false, failThreshold: 55 };
    }
    if (!this.headStability.anchor) this.headStability.anchor = { ...p };
    this.headStability.samples.push({ ...p });
    if (this.headStability.samples.length > 22) this.headStability.samples.shift();
    let total = 0;
    for (const s of this.headStability.samples) {
      total += Math.hypot(s.x - this.headStability.anchor.x, s.y - this.headStability.anchor.y);
    }
    const avg = total / this.headStability.samples.length;
    return { stable: avg < 24, delta: avg, visible: true, failThreshold: 55, amount: Math.max(0, 1 - avg / 42) };
  }

  resetHeadStability() {
    this.headStability = { samples: [], anchor: null };
  }

  drawOverlay(ctx, w, h, eyeOpen = true, mouthState = null) {
    const f = this.getFace();
    if (!f) return;

    const px = (idx) => f[idx].x * w;
    const py = (idx) => f[idx].y * h;

    ctx.strokeStyle = "rgba(201, 169, 98, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    FACE_OVAL.forEach((idx, i) => {
      if (i === 0) ctx.moveTo(px(idx), py(idx));
      else ctx.lineTo(px(idx), py(idx));
    });
    ctx.closePath();
    ctx.stroke();

    const eyeColor = eyeOpen ? "rgba(120, 200, 140, 0.9)" : "rgba(220, 60, 60, 0.95)";
    ctx.strokeStyle = eyeColor;
    ctx.lineWidth = 1.5;
    for (const ring of [
      [33, 160, 158, 133, 153, 144],
      [362, 385, 387, 263, 373, 380],
    ]) {
      ctx.beginPath();
      ring.forEach((idx, i) => {
        if (i === 0) ctx.moveTo(px(idx), py(idx));
        else ctx.lineTo(px(idx), py(idx));
      });
      ctx.closePath();
      ctx.stroke();
    }

    if (mouthState) {
      const lipOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
      const lipInner = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
      const smiling = mouthState.smiling;
      const open = mouthState.mouthOpen;
      const lipColor = smiling
        ? "rgba(120, 210, 150, 0.95)"
        : open
          ? "rgba(255, 90, 90, 0.95)"
          : "rgba(201, 169, 98, 0.85)";

      ctx.strokeStyle = lipColor;
      ctx.lineWidth = 2;
      for (const ring of [lipOuter, lipInner]) {
        ctx.beginPath();
        ring.forEach((idx, i) => {
          if (i === 0) ctx.moveTo(px(idx), py(idx));
          else ctx.lineTo(px(idx), py(idx));
        });
        ctx.closePath();
        ctx.stroke();
      }

      ctx.fillStyle = open ? "rgba(255, 60, 60, 0.35)" : "rgba(0, 0, 0, 0.15)";
      ctx.beginPath();
      lipOuter.forEach((idx, i) => {
        if (i === 0) ctx.moveTo(px(idx), py(idx));
        else ctx.lineTo(px(idx), py(idx));
      });
      ctx.closePath();
      ctx.fill();

      const label = smiling ? "Sonrisa" : open ? "Boca abierta" : "Boca cerrada";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillStyle = lipColor;
      const mx = (px(61) + px(291)) / 2;
      const my = py(17) - 10;
      ctx.fillText(label, mx - ctx.measureText(label).width / 2, my);
    }
  }
}
