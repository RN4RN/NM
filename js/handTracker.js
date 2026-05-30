/**
 * Tracking de manos — MediaPipe Hand Landmarker
 */

import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export class HandTracker {
  constructor(video, canvas) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.landmarker = null;
    this.running = false;
    this.mirror = true;
    this.lastResults = { landmarks: [], handedness: [] };
    this.lastVideoTime = -1;
    this.stability = { samples: [], anchor: null };
    this.drawPath = [];
    this._palmHistory = [];
    this._motion = { speed: 0, wave: false };
    this._gesture = "none";
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks(WASM);
    try {
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
      });
    } catch {
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 1,
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

  getHand() {
    return this.lastResults.landmarks?.[0] ?? null;
  }

  isVisible() {
    return !!this.getHand();
  }

  getPalm(w, h) {
    const lm = this.getHand();
    if (!lm) return null;
    let x = ((lm[0].x + lm[9].x) / 2) * w;
    const y = ((lm[0].y + lm[9].y) / 2) * h;
    if (this.mirror) x = w - x;
    return { x, y };
  }

  getIndex(w, h) {
    const lm = this.getHand();
    if (!lm) return null;
    let x = lm[8].x * w;
    const y = lm[8].y * h;
    if (this.mirror) x = w - x;
    return { x, y };
  }

  isFingerExtended(lm, tip, pip, mcp) {
    const t = lm[tip];
    const p = lm[pip];
    const w = lm[0];
    return t.y < p.y - 0.02 || Math.hypot(t.x - w.x, t.y - w.y) > Math.hypot(p.x - w.x, p.y - w.y) * 1.03;
  }

  isOpenHand() {
    const lm = this.getHand();
    if (!lm) return false;
    const up = [8, 12, 16, 20].filter((tip, i) => {
      const pips = [6, 10, 14, 18];
      const mcps = [5, 9, 13, 17];
      return this.isFingerExtended(lm, tip, pips[i], mcps[i]);
    });
    return up.length >= 3;
  }

  getFistAmount() {
    const lm = this.getHand();
    if (!lm) return 0;
    let c = 0;
    for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
      if (lm[tip].y > lm[pip].y - 0.01) c += 1;
    }
    return c / 4;
  }

  isPinching(threshold = 0.072) {
    const lm = this.getHand();
    if (!lm) return false;
    return Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) < threshold;
  }

  /** Punto normalizado 0–1 (índice o palma) */
  getNormalizedPoint() {
    const w = this.canvas.width || 320;
    const h = this.canvas.height || 240;
    const p = this.getIndex(w, h) || this.getPalm(w, h);
    if (!p) return null;
    return { x: p.x / w, y: p.y / h, raw: p };
  }

  trackStability(w, h) {
    const p = this.getPalm(w, h);
    if (!p) {
      this.stability = { samples: [], anchor: null };
      return { stable: false, delta: 999, visible: false, failThreshold: 62 };
    }
    if (!this.stability.anchor) this.stability.anchor = { ...p };
    this.stability.samples.push({ ...p });
    if (this.stability.samples.length > 22) this.stability.samples.shift();
    let total = 0;
    for (const s of this.stability.samples) {
      total += Math.hypot(s.x - this.stability.anchor.x, s.y - this.stability.anchor.y);
    }
    const avg = total / this.stability.samples.length;
    return {
      stable: avg < 22,
      delta: avg,
      visible: true,
      failThreshold: 62,
      amount: Math.max(0, 1 - avg / 45),
    };
  }

  resetStability() {
    this.stability = { samples: [], anchor: null };
    this._palmHistory = [];
    this._motion = { speed: 0, wave: false };
  }

  /** Actualizar velocidad de mano (llamar cada frame) */
  updateMotion() {
    const w = this.canvas.width || 320;
    const h = this.canvas.height || 240;
    const p = this.getPalm(w, h);
    if (!p) {
      this._palmHistory = [];
      this._motion = { speed: 0, wave: false };
      return this._motion;
    }
    this._palmHistory.push({ x: p.x, y: p.y });
    if (this._palmHistory.length > 14) this._palmHistory.shift();

    let dist = 0;
    for (let i = 1; i < this._palmHistory.length; i += 1) {
      const a = this._palmHistory[i];
      const b = this._palmHistory[i - 1];
      dist += Math.hypot(a.x - b.x, a.y - b.y);
    }
    const speed = dist / Math.max(1, this._palmHistory.length - 1);
    this._motion = {
      speed,
      wave: this.isOpenHand() && speed > 14,
      palmY: p.y / h,
      palmX: p.x / w,
    };
    return this._motion;
  }

  isPalmPush() {
    return this.isOpenHand() && this._motion.palmY < 0.42;
  }

  isPointingAt(normX, normY, tol = 0.14) {
    if (this.getGesture() !== "point" && this.getGesture() !== "pinch") return false;
    const p = this.getNormalizedPoint();
    if (!p) return false;
    return Math.hypot(p.x - normX, p.y - normY) < tol;
  }

  getGesture() {
    if (!this.isVisible()) return "none";
    if (this._motion.wave) return "wave";
    if (this.isPinching()) return "pinch";
    if (this.isPalmPush()) return "push";
    if (this.getFistAmount() > 0.72) return "fist";
    if (this.isOpenHand()) return "open";
    return "point";
  }

  getGestureLabel(gesture) {
    const labels = {
      none: "—",
      pinch: "Pinza",
      fist: "Puño",
      open: "Palma",
      point: "Señalar",
      wave: "Saludar",
      push: "Empujar",
    };
    return labels[gesture] ?? gesture;
  }

  sampleDrawPath(w, h, active) {
    const p = this.getIndex(w, h);
    if (!active || !p) return this.drawPath;
    const lm = this.getHand();
    if (!this.isFingerExtended(lm, 8, 6, 5)) return this.drawPath;
    const last = this.drawPath[this.drawPath.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 6) {
      this.drawPath.push({ x: p.x / w, y: p.y / h });
    }
    return this.drawPath;
  }

  clearDrawPath() {
    this.drawPath = [];
  }

  draw(ctx, faceDrawFn) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    if (this.mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    faceDrawFn?.(ctx, w, h);
    const lm = this.getHand();
    if (lm) {
      ctx.strokeStyle = "rgba(180, 40, 40, 0.45)";
      ctx.lineWidth = 2;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * w, lm[a].y * h);
        ctx.lineTo(lm[b].x * w, lm[b].y * h);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(201, 169, 98, 0.85)";
      for (const i of [0, 4, 8, 12, 16, 20]) {
        ctx.beginPath();
        ctx.arc(lm[i].x * w, lm[i].y * h, i === 8 ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }
}

export function matchSymbolPath(drawn, template, threshold = 0.14) {
  if (drawn.length < 8) return { ok: false, score: 0 };
  const resampled = resample(drawn, 32);
  const tpl = resample(template, 32);
  let total = 0;
  for (let i = 0; i < 32; i += 1) total += Math.hypot(resampled[i].x - tpl[i].x, resampled[i].y - tpl[i].y);
  const avg = total / 32;
  return { ok: avg < threshold, score: Math.max(0, 1 - avg / 0.25) };
}

function resample(pts, n) {
  if (pts.length < 2) return pts;
  const lengths = [0];
  for (let i = 1; i < pts.length; i += 1) {
    lengths.push(lengths[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = lengths[lengths.length - 1] || 1;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const target = (i / (n - 1)) * total;
    let j = 1;
    while (j < lengths.length && lengths[j] < target) j += 1;
    const l0 = lengths[j - 1];
    const l1 = lengths[j] ?? l0;
    const t = l1 === l0 ? 0 : (target - l0) / (l1 - l0);
    const p0 = pts[j - 1];
    const p1 = pts[j] ?? p0;
    out.push({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t });
  }
  return out;
}
