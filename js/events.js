/**
 * Bus de eventos narrativos — la historia reacciona a gestos y expresiones.
 */

export class StoryEvents {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._handlers = new Map();
    this._prev = {};
  }

  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(fn);
    return () => this._handlers.get(event)?.delete(fn);
  }

  emit(event, payload = {}) {
    this._handlers.get(event)?.forEach((fn) => fn(payload));
  }

  /** Emite solo en transición de estado (flanco) */
  edge(key, value, onTrue, onFalse, payload = {}) {
    const prev = this._prev[key];
    if (prev === value) return;
    this._prev[key] = value;
    if (value) this.emit(onTrue, payload);
    else if (prev !== undefined) this.emit(onFalse, payload);
  }

  resetEdges() {
    this._prev = {};
  }

  clearEdge(key) {
    delete this._prev[key];
  }
}

/** Nombres de eventos del sistema */
export const EV = {
  SMILE_DETECTED: "onSmileDetected",
  SMILE_LOST: "onSmileLost",
  EYES_CLOSED: "onEyesClosed",
  EYES_OPENED: "onEyesOpened",
  MOUTH_OPENED: "onMouthOpened",
  MOUTH_CLOSED: "onMouthClosed",
  FACE_LOST: "onFaceLost",
  FACE_FOUND: "onFaceFound",
  HAND_DETECTED: "onHandDetected",
  HAND_LOST: "onHandLost",
  GAZE_ON_THREAT: "onGazeOnThreat",
  GAZE_OFF_THREAT: "onGazeOffThreat",
  HAND_WAVE: "onHandWave",
  HAND_WAVE_END: "onHandWaveEnd",
  HAND_PUSH: "onHandPush",
  HAND_PUSH_END: "onHandPushEnd",
};
