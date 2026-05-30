/**
 * Motor narrativo — escenas, progreso y estadísticas del juicio final.
 */

import { loadSave, writeSave, createDefaultSave } from "./storage.js";

export const SCENES = {
  title: { id: "title", progress: 0, screen: "title" },
  ch_arrival: { id: "ch_arrival", progress: 8, screen: "narrative" },
  int_lantern: { id: "int_lantern", progress: 14, screen: "flashlight" },
  ch_housekeeper: { id: "ch_housekeeper", progress: 22, screen: "housekeeper" },
  ch_portrait: { id: "ch_portrait", progress: 34, screen: "portrait" },
  ch_watcher: { id: "ch_watcher", progress: 48, screen: "watcher" },
  ch_silence: { id: "ch_silence", progress: 60, screen: "silence" },
  ch_reflection: { id: "ch_reflection", progress: 74, screen: "reflection" },
  ch_judgment: { id: "ch_judgment", progress: 88, screen: "judgment" },
  ending_good: { id: "ending_good", progress: 100, screen: "ending" },
  ending_bad: { id: "ending_bad", progress: 100, screen: "ending" },
  ending_secret: { id: "ending_secret", progress: 100, screen: "ending" },
  ending_housekeeper: { id: "ending_housekeeper", progress: 100, screen: "ending" },
};

export const STORY_ORDER = [
  "title",
  "ch_arrival",
  "int_lantern",
  "ch_housekeeper",
  "ch_portrait",
  "ch_watcher",
  "ch_silence",
  "ch_reflection",
  "ch_judgment",
];

export const CHAPTER_MENU = [
  { label: "Inicio", scene: "title" },
  { label: "La llegada", scene: "ch_arrival" },
  { label: "Linterna", scene: "int_lantern" },
  { label: "La ama de casa", scene: "ch_housekeeper" },
  { label: "No parpadees", scene: "ch_portrait" },
  { label: "Sombra observadora", scene: "ch_watcher" },
  { label: "No hagas ruido", scene: "ch_silence" },
  { label: "El reflejo", scene: "ch_reflection" },
  { label: "El juicio", scene: "ch_judgment" },
];

export const ENDINGS = {
  ending_good: {
    title: "Final — La puerta se abre",
    body: "La casa te reconoce como visitante. La manija cede. Afuera, el aire huele a lluvia reciente… y a libertad.",
  },
  ending_bad: {
    title: "Final — Nuevo habitante",
    body: "La casa te absorbió. Ahora hay una silla vacía más. Alguien más llegará pronto.",
  },
  ending_secret: {
    title: "Final secreto — Siempre fuiste de aquí",
    body: "Recuerdas habitaciones que nunca visitaste. Sonríes sin querer. Siempre fuiste parte de la casa.",
  },
  ending_housekeeper: {
    title: "Final — La ama de casa",
    body: "No supiste disimular el miedo. Ella lo olió en tu rostro. Ahora te observa para siempre, inmóvil como el primer día.",
  },
};

export function createStats() {
  return {
    smileSeconds: 0,
    eyesOpenSeconds: 0,
    watchSeconds: 0,
    mouthClosedSeconds: 0,
    handStableSeconds: 0,
    housekeeperFails: 0,
    portraitBlinks: 0,
    silenceBreaks: 0,
    chaptersCleared: 0,
  };
}

export class StoryEngine {
  constructor() {
    this.data = loadSave() ?? createDefaultSave();
    this.sceneId = this.data.currentScene || "title";
    this.stats = { ...createStats(), ...(this.data.stats ?? {}) };
    this.listeners = new Set();
  }

  get scene() {
    return SCENES[this.sceneId] ?? SCENES.title;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.data.stats = this.stats;
    this.listeners.forEach((fn) => fn(this));
    writeSave(this.data);
  }

  goTo(id) {
    if (!SCENES[id]) return;
    this.sceneId = id;
    this.data.currentScene = id;
    this.data.progress = SCENES[id].progress;
    if (!this.data.unlockedChapters.includes(id)) this.data.unlockedChapters.push(id);
    this.emit();
  }

  next() {
    const i = STORY_ORDER.indexOf(this.sceneId);
    if (i >= 0 && i < STORY_ORDER.length - 1) this.goTo(STORY_ORDER[i + 1]);
  }

  retryChapter(sceneId) {
    if (!SCENES[sceneId]) return;
    this.goTo(sceneId);
  }

  completeChapter() {
    this.stats.chaptersCleared += 1;
    this.next();
  }

  setEnding(id) {
    this.data.endingSeen = id;
    this.data.completedOnce = true;
    this.goTo(id);
  }

  reset() {
    this.data = createDefaultSave();
    this.stats = createStats();
    this.sceneId = "title";
    this.emit();
  }

  /** Puntuación 0–100 para el juicio final */
  computeJudgmentScore() {
    const s = this.stats;
    let score = 0;
    score += Math.min(25, s.smileSeconds * 2);
    score += Math.min(25, s.eyesOpenSeconds * 0.8);
    score += Math.min(20, s.watchSeconds * 1.2);
    score += Math.min(15, s.mouthClosedSeconds * 0.6);
    score += Math.min(15, s.handStableSeconds * 0.5);
    score -= s.housekeeperFails * 8;
    score -= s.portraitBlinks * 0.5;
    score -= s.silenceBreaks * 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  resolveJudgment() {
    const score = this.computeJudgmentScore();
    const s = this.stats;
    if (
      score >= 82 &&
      s.chaptersCleared >= 6 &&
      s.smileSeconds >= 12 &&
      s.eyesOpenSeconds >= 25
    ) {
      return "ending_secret";
    }
    if (score >= 55) return "ending_good";
    return "ending_bad";
  }

  tickStats(hub, dt) {
    const { eye, mouth, threat } = hub.last ?? {};
    if (mouth?.smiling) this.stats.smileSeconds += dt;
    if (eye?.open) this.stats.eyesOpenSeconds += dt;
    if (threat) this.stats.watchSeconds += dt;
    if (mouth && !mouth.mouthOpen) this.stats.mouthClosedSeconds += dt;
    const w = hub.hand.canvas.width || 320;
    const h = hub.hand.canvas.height || 240;
    const stab = hub.hand.trackStability(w, h);
    if (stab.stable) this.stats.handStableSeconds += dt;
  }
}
