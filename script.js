/**
 * SOMBRAS — Orquestador principal
 */

import { StoryEngine, CHAPTER_MENU, ENDINGS } from "./js/storyEngine.js";
import { AudioManager } from "./js/audioManager.js";
import { PerceptionHub } from "./js/perceptionHub.js";
import { SceneDirector } from "./js/scenes.js";
import { ParticleField, drawStageEffects } from "./js/particles.js";
import { BlinkSync } from "./js/blinkSync.js";
import { mountCharacter } from "./js/characters.js";
import { CameraCapture } from "./js/cameraCapture.js";

const video = document.getElementById("video");
const handCanvas = document.getElementById("handCanvas");
const particlesCanvas = document.getElementById("particles");
const stageCanvas = document.getElementById("stage");
const sceneLayer = document.getElementById("sceneLayer");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const gestureBadge = document.getElementById("gestureBadge");
const gesturePanel = document.getElementById("gesturePanel");
const chapterMenu = document.getElementById("chapterMenu");
const chapterList = document.getElementById("chapterList");

const refs = {
  chapterTag: document.getElementById("chapterTag"),
  typewriter: document.getElementById("typewriter"),
  interactionHint: document.getElementById("interactionHint"),
  statusLine: document.getElementById("statusLine"),
  flashCanvas: document.getElementById("flashCanvas"),
  letterCard: document.getElementById("letterCard"),
  stillFill: document.getElementById("stillFill"),
  glitchLayer: document.getElementById("glitchLayer"),
  mirrorReflection: document.getElementById("mirrorReflection"),
  endingTitle: document.getElementById("endingTitle"),
  endingBody: document.getElementById("endingBody"),
  confidenceFill: document.getElementById("confidenceFill"),
  confidenceLabel: document.getElementById("confidenceLabel"),
  portraitFigure: document.getElementById("portraitFigure"),
  creatureFigure: document.getElementById("creatureFigure"),
  judgmentScore: document.getElementById("judgmentScore"),
  judgmentDetails: document.getElementById("judgmentDetails"),
  statusLine: document.getElementById("statusLine"),
};

const story = new StoryEngine();
const audio = new AudioManager();
const hub = new PerceptionHub(video, handCanvas);
const particles = new ParticleField(particlesCanvas);
const director = new SceneDirector(refs, audio, hub, story);
const blinkSync = new BlinkSync(hub, sceneLayer);
const cameraCapture = new CameraCapture(video, { intervalMs: 5000 });

hub.eyes.applySensitivity(70);

mountCharacter(document.getElementById("titleChar"), "watcher");

let lastTime = performance.now();
let cameraReady = false;

function updateProgress() {
  progressFill.style.width = `${story.scene.progress ?? 0}%`;
  progressLabel.textContent = `${story.scene.progress ?? 0}%`;
}

function buildChapterMenu() {
  chapterList.innerHTML = CHAPTER_MENU.map(({ label, scene }) => {
    const ok = story.data.unlockedChapters.includes(scene) || scene === "title";
    return `<li><button type="button" data-scene="${scene}" ${ok ? "" : "disabled"}>${label}</button></li>`;
  }).join("");
  chapterList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.scene) {
        story.goTo(btn.dataset.scene);
        chapterMenu.hidden = true;
      }
    });
  });
}

function setChip(name, active, warn = false) {
  const chip = gesturePanel?.querySelector(`[data-g="${name}"]`);
  if (!chip) return;
  chip.classList.toggle("active", active);
  chip.classList.toggle("warn", warn);
}

function updateBadge() {
  const mouth = hub.last?.mouth;
  const eye = hub.last?.eye;
  const handOk = hub.hand.isVisible();
  const faceOk = hub.face.isVisible();
  const eyesOk = !!eye?.open;
  const hGesture = hub.hand.getGesture();
  const hLabel = hub.hand.getGestureLabel(hGesture);

  const parts = [];
  if (handOk) parts.push(hLabel !== "—" ? hLabel : "Mano ✓");
  else parts.push("Mano —");
  if (faceOk) parts.push("Rostro ✓");
  if (mouth?.smiling) parts.push("Sonrisa");
  if (eye && !eyesOk) parts.push("Parpadeo");
  else if (eyesOk) parts.push("Ojos ✓");
  if (mouth?.mouthOpen) parts.push("Boca abierta");

  gestureBadge.textContent = parts.join(" · ") || "—";
  gestureBadge.classList.toggle("warn", (!eyesOk && faceOk) || !!mouth?.mouthOpen);

  setChip("hand", handOk);
  setChip("face", faceOk);
  setChip("eyes", eyesOk && faceOk, !eyesOk && faceOk);

  const handChip = gesturePanel?.querySelector('[data-g="hand"] .gestureLabel');
  if (handChip) handChip.textContent = handOk ? hLabel : "Mano";

  const mouthOk = mouth && !mouth.mouthOpen && !mouth.smiling;
  const mouthActive = mouth?.smiling || mouthOk;
  setChip("mouth", !!mouthActive, !!mouth?.mouthOpen);

  const mouthChip = gesturePanel?.querySelector('[data-g="mouth"] .gestureLabel');
  if (mouthChip && mouth) {
    if (mouth.smiling) mouthChip.textContent = "Sonrisa";
    else if (mouth.mouthOpen) mouthChip.textContent = "Abierta";
    else mouthChip.textContent = "Cerrada";
  }

  const eyesChip = gesturePanel?.querySelector('[data-g="eyes"] .gestureLabel');
  if (eyesChip) eyesChip.textContent = eyesOk ? "Abiertos" : "Cerrados";
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (cameraReady) {
    hub.detect(now, dt);
    hub.draw();
    story.tickStats(hub, dt);
    updateBadge();
  }

  director.update(dt);
  drawStageEffects(stageCanvas.getContext("2d"), stageCanvas.width, stageCanvas.height, now);
}

async function initCamera() {
  await hub.init();
  await hub.start();
  cameraReady = true;
  blinkSync.start();
  cameraCapture.start();
  const panel = document.querySelector(".cameraDock .cameraFrame");
  hub.resize(panel.clientWidth, panel.clientHeight || 180);
}

document.getElementById("btnStart")?.addEventListener("click", async () => {
  chapterMenu.hidden = true;
  await audio.resume();
  audio.startAmbient("default");
  if (!cameraReady) await initCamera();
  story.goTo("ch_arrival");
});

document.getElementById("btnChapters")?.addEventListener("click", () => {
  buildChapterMenu();
  chapterMenu.hidden = false;
});

document.getElementById("btnCloseMenu")?.addEventListener("click", () => {
  chapterMenu.hidden = true;
});

chapterMenu?.addEventListener("click", (e) => {
  if (e.target === chapterMenu) chapterMenu.hidden = true;
});

document.getElementById("btnMenu")?.addEventListener("click", () => {
  buildChapterMenu();
  chapterMenu.hidden = !chapterMenu.hidden;
});

document.getElementById("btnReplay")?.addEventListener("click", () => {
  story.reset();
  director.enterScene("title");
  updateProgress();
  buildChapterMenu();
});

story.onChange((s) => {
  updateProgress();
  director.enterScene(s.sceneId);
  buildChapterMenu();
});

window.addEventListener("resize", () => {
  particles.resize();
  stageCanvas.width = window.innerWidth;
  stageCanvas.height = window.innerHeight;
  const panel = document.querySelector(".cameraDock .cameraFrame");
  if (panel) hub.resize(panel.clientWidth, panel.clientHeight || 180);
});

particles.resize();
stageCanvas.width = window.innerWidth;
stageCanvas.height = window.innerHeight;
particles.start();
requestAnimationFrame(loop);

director.enterScene(story.sceneId);
updateProgress();
buildChapterMenu();

document.body.addEventListener("click", () => {
  if (!cameraReady) initCamera();
  audio.resume();
}, { once: true });

export { ENDINGS };
