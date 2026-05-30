/**
 * Escenas cinematográficas — mecánicas integradas en la narrativa.
 */

import { NARRATIVE, typewriter } from "./narrative.js";
import { ENDINGS } from "./storyEngine.js";
import { EV } from "./events.js";
import { triggerGlitch, setTension, setFlicker } from "./particles.js";
import { mountCharacter, setNarrativeCharacter } from "./characters.js";

const CHAPTER_IDS = {
  lantern: "int_lantern",
  housekeeper: "ch_housekeeper",
  portrait: "ch_portrait",
  watcher: "ch_watcher",
  silence: "ch_silence",
  reflection: "ch_reflection",
  judgment: "ch_judgment",
};

export class SceneDirector {
  constructor(refs, audio, hub, story) {
    this.refs = refs;
    this.audio = audio;
    this.hub = hub;
    this.story = story;
    this.timers = [];
    this.phase = null;
    this.unsubs = [];
  }

  clear() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.phase = null;
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    setTension(false);
    setFlicker(false);
    this.audio.stopFootsteps();
    this.audio.setTensionLevel(0.35);
    if (this.refs.stillFill) this.refs.stillFill.style.width = "0%";
    if (this.refs.confidenceFill) this.refs.confidenceFill.style.width = "0%";
  }

  show(screen) {
    document.querySelectorAll(".screen").forEach((el) => {
      const on = el.dataset.screen === screen;
      el.classList.toggle("active", on);
      el.hidden = !on;
    });
    const progressScreens = new Set(["portrait", "watcher", "silence"]);
    const bar = document.getElementById("sceneProgressBar");
    if (bar) bar.hidden = !progressScreens.has(screen);
  }

  setHint(text, visible = true) {
    const el = this.refs.interactionHint;
    if (!el) return;
    el.textContent = text ?? "";
    el.classList.toggle("visible", visible && !!text);
  }

  setStatus(text) {
    if (this.refs.statusLine) this.refs.statusLine.textContent = text;
  }

  failLevel(chapterId, message) {
    this.phase = null;
    this.audio.playScare();
    triggerGlitch(this.refs.glitchLayer);
    setTension(true);
    const overlay = document.getElementById("retryOverlay");
    const msg = document.getElementById("retryMessage");
    const btn = document.getElementById("btnRetryLevel");
    if (!overlay || !btn) {
      this.story.retryChapter(chapterId);
      return;
    }
    if (msg) msg.textContent = message;
    overlay.hidden = false;
    btn.onclick = () => {
      overlay.hidden = true;
      setTension(false);
      this.story.retryChapter(chapterId);
    };
  }

  /** Convierte mano de cámara a coords del canvas objetivo */
  _handOnCanvas(canvas) {
    const norm = this.hub.hand.getNormalizedPoint();
    if (!norm) return null;
    return {
      x: norm.x * canvas.width,
      y: norm.y * canvas.height,
      gesture: this.hub.hand.getGesture(),
      norm,
    };
  }

  async narrative(key, thenPlay) {
    const data = NARRATIVE[key];
    if (!data) return;
    setNarrativeCharacter(key);
    this.show("narrative");
    this.refs.chapterTag.textContent = data.chapter;
    this.setHint("");
    await typewriter(this.refs.typewriter, data.lines);
    this.setHint(data.hint);
    if (thenPlay) {
      this.timers.push(setTimeout(() => this.enterPlay(thenPlay), 2800));
    } else if (data.next) {
      this.timers.push(setTimeout(() => this.story.goTo(data.next), data.autoDelay ?? 3500));
    }
  }

  enterScene(id) {
    this.clear();
    this.hub.resetSessionTrackers();

    switch (id) {
      case "title":
        this.show("title");
        mountCharacter(document.getElementById("titleChar"), "watcher");
        this.audio.startAmbient("default");
        break;
      case "ch_arrival":
        this.narrative("ch_arrival");
        break;
      case "int_lantern":
        this.playLantern();
        break;
      case "ch_housekeeper":
        this.narrative("ch_housekeeper_intro", "housekeeper");
        break;
      case "ch_portrait":
        this.narrative("ch_portrait_intro", "portrait");
        break;
      case "ch_watcher":
        this.narrative("ch_watcher_intro", "watcher");
        break;
      case "ch_silence":
        this.narrative("ch_silence_intro", "silence");
        break;
      case "ch_reflection":
        this.narrative("ch_reflection_intro", "reflection");
        break;
      case "ch_judgment":
        this.narrative("ch_judgment_intro", "judgment");
        break;
      case "ending_good":
      case "ending_bad":
      case "ending_secret":
      case "ending_housekeeper":
        this.showEnding(id);
        break;
      default:
        this.show("title");
    }
  }

  enterPlay(kind) {
    switch (kind) {
      case "housekeeper":
        this.playHousekeeper();
        break;
      case "portrait":
        this.playPortrait();
        break;
      case "watcher":
        this.playWatcher();
        break;
      case "silence":
        this.playSilence();
        break;
      case "reflection":
        this.playReflection();
        break;
      case "judgment":
        this.playJudgment();
        break;
      default:
        break;
    }
  }

  /** Linterna — mano ilumina; pinza agarra la carta 📜 */
  playLantern() {
    this.show("flashlight");
    const canvas = this.refs.flashCanvas;
    const letter = this.refs.letterCard;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    if (letter) {
      letter.classList.remove("lit", "grabbed");
      letter.hidden = false;
    }
    const letterX = 0.22 + Math.random() * 0.56;
    const letterY = 0.28 + Math.random() * 0.44;
    if (letter) {
      letter.style.left = `${letterX * 100}%`;
      letter.style.top = `${letterY * 100}%`;
      letter.classList.remove("lit", "grabbed", "near");
    }
    document.querySelectorAll(".lanternShadow").forEach((s) => s.classList.remove("seen"));
    const hint = document.getElementById("lanternHint");
    if (hint) {
      hint.classList.remove("faded");
      this.timers.push(setTimeout(() => hint.classList.add("faded"), 9000));
    }
    const sl = document.getElementById("shadowLeft");
    const sr = document.getElementById("shadowRight");
    const shadowLeft = { x: 0.06 + Math.random() * 0.22, y: 0.38 + Math.random() * 0.22 };
    const shadowRight = { x: 0.72 + Math.random() * 0.2, y: 0.34 + Math.random() * 0.24 };
    if (sl) {
      sl.style.left = `${shadowLeft.x * 100}%`;
      sl.style.top = `${shadowLeft.y * 100}%`;
    }
    if (sr) {
      sr.style.left = `${shadowRight.x * 100}%`;
      sr.style.top = `${shadowRight.y * 100}%`;
      sr.style.right = "auto";
    }
    this.phase = {
      type: "lantern",
      lit: 0,
      grab: 0,
      shadowTimer: 0,
      resize,
      letterX,
      letterY,
      shadowLeft,
      shadowRight,
    };
    this.setStatus("Palma = luz · Explora la oscuridad · Pinza = agarrar");
  }

  updateLantern(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "lantern") return;
    const canvas = this.refs.flashCanvas;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const hand = this._handOnCanvas(canvas);
    const letter = this.refs.letterCard;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    let radius = Math.min(w, h) * 0.1;
    if (hand) {
      if (hand.gesture === "open") radius *= 1.35;
      if (hand.gesture === "fist") radius *= 0.48;
      if (hand.gesture === "push") radius *= 1.15;
      if (hand.gesture === "point") radius *= 0.78;
    }

    [
      { el: document.getElementById("shadowLeft"), ...ph.shadowLeft },
      { el: document.getElementById("shadowRight"), ...ph.shadowRight },
    ].forEach(({ el, x, y }) => {
      if (!el) return;
      const sx = x * w;
      const sy = y * h;
      const seenByLight = hand && Math.hypot(hand.x - sx, hand.y - sy) < radius * 0.95;
      const seen = seenByLight;
      el.classList.toggle("seen", seen);
      if (seen) ph.shadowTimer = Math.max(0, ph.shadowTimer - dt * 1.5);
    });

    if (!hand) {
      ph.shadowTimer += dt * 0.35;
      this.setStatus("Levanta la mano. Algo espera en la oscuridad.");
      if (letter) letter.classList.remove("lit", "near");
      return;
    }

    if (hand.gesture === "wave") {
      ph.shadowTimer = Math.max(0, ph.shadowTimer - dt * 2.2);
      this.setStatus("Saludas — las sombras retroceden un instante.");
    }

    const g = ctx.createRadialGradient(hand.x, hand.y, 0, hand.x, hand.y, radius);
    g.addColorStop(0, "rgba(255,220,180,0.82)");
    g.addColorStop(0.35, "rgba(255,190,140,0.14)");
    g.addColorStop(0.72, "rgba(255,160,100,0.03)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const dist = Math.hypot(hand.x - ph.letterX * w, hand.y - ph.letterY * h);
    const litByHand = dist < radius * 0.82;
    const lit = litByHand;

    if (letter) {
      letter.classList.toggle("lit", lit);
      letter.classList.toggle("near", !lit && dist < radius * 1.65);
    }

    if (lit) {
      ph.lit += dt;
      if (hand.gesture === "pinch" && litByHand) {
        ph.grab += dt * (hand.norm && Math.hypot(hand.norm.x - ph.letterX, hand.norm.y - ph.letterY) < 0.1 ? 1.35 : 1);
        this.setStatus(`Agarrando… ${Math.ceil(1.5 - ph.grab)}s`);
      } else if (hand.gesture === "push" && litByHand) {
        ph.lit += dt * 0.25;
        this.setStatus("Empujas la luz hacia lo que encontraste…");
      } else {
        this.setStatus(`Iluminando… ${Math.ceil(3 - ph.lit)}s`);
      }
    } else {
      ph.lit = Math.max(0, ph.lit - dt * 0.35);
      ph.grab = Math.max(0, ph.grab - dt * 0.45);
      const near = hand && Math.hypot(hand.x - ph.letterX * w, hand.y - ph.letterY * h) < radius * 1.65;
      this.setStatus(near ? "Algo brilla ahí… acerca más la luz." : "Busca en la oscuridad con tu mano.");
    }

    ph.shadowTimer += hand.gesture === "fist" ? dt * 0.8 : dt * 0.15;
    if (ph.shadowTimer >= 8) {
      window.removeEventListener("resize", ph.resize);
      this.failLevel(CHAPTER_IDS.lantern, "Las sombras se llevaron la carta. Vuelve a buscarla.");
      return;
    }

    if (ph.grab >= 1.5 || ph.lit >= 3) {
      window.removeEventListener("resize", ph.resize);
      if (letter) letter.classList.add("grabbed");
      this.audio.playSuccess();
      this.timers.push(setTimeout(() => this.story.completeChapter(), 600));
    }
  }

  /** Ama de casa — sonrisa = confianza oculta */
  playHousekeeper() {
    this.show("housekeeper");
    mountCharacter(document.getElementById("housekeeperChar"), "housekeeper");
    this.phase = {
      type: "housekeeper",
      fails: 0,
      approach: 0,
      smileHold: 0,
    };
    this.audio.startAmbient("tension");
    this.unsubs.push(
      this.hub.events.on(EV.SMILE_DETECTED, () => {
        if (this.phase?.type === "housekeeper") this.setStatus("Ella inclina la cabeza… casi te cree.");
      }),
      this.hub.events.on(EV.SMILE_LOST, () => {
        if (this.phase?.type === "housekeeper") this.phase.approach += 0.04;
      }),
    );
    this.setStatus("Sonríe · Palma abierta la calma · Empuja para alejarla");
  }

  updateHousekeeper(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "housekeeper") return;
    const mouth = this.hub.last?.mouth ?? this.hub.mouth.analyze(0);
    const conf = Math.min(100, mouth.confidence * 100);
    if (this.refs.confidenceFill) this.refs.confidenceFill.style.width = `${conf}%`;
    if (this.refs.confidenceLabel) {
      this.refs.confidenceLabel.textContent = mouth.smiling
        ? `Confianza ${conf.toFixed(0)}%`
        : "Ella huele tu miedo…";
    }
    const el = document.getElementById("housekeeperChar");
    if (el) {
      const dist = 100 - conf + ph.approach * 40;
      el.style.transform = `translateX(${Math.min(42, dist * 0.35)}%) scale(${1 + ph.approach * 0.15})`;
      el.classList.toggle("horrorChar--tense", !mouth.smiling);
      el.classList.toggle("horrorChar--calm", mouth.smiling);
    }

    const gesture = this.hub.hand.getGesture();
    if (gesture === "push" && this.hub.hand.isVisible()) {
      ph.approach = Math.max(0, ph.approach - dt * 0.55);
      if (!mouth.smiling) this.setStatus("La empujas. Gana un segundo… sonríe.");
    }
    if (gesture === "wave" && mouth.smiling) {
      ph.smileHold += dt * 0.25;
      this.setStatus("Saludas con una sonrisa. Casi te deja pasar.");
    }
    if (gesture === "open" && mouth.smiling) {
      ph.approach = Math.max(0, ph.approach - dt * 0.18);
    }

    if (mouth.smiling) {
      ph.smileHold += dt;
      ph.approach = Math.max(0, ph.approach - dt * 0.25);
      this.audio.setTensionLevel(0.35 + ph.approach * 0.5);
      this.setStatus("Bien… mantén esa sonrisa.");
      if (ph.smileHold >= 4) {
        this.audio.playSuccess();
        this.story.completeChapter();
      }
    } else {
      ph.smileHold = Math.max(0, ph.smileHold - dt * 0.5);
      ph.approach += dt * 0.08;
      this.audio.setTensionLevel(0.45 + ph.approach * 0.55);
      setTension(ph.approach > 0.5);
      if (ph.approach >= 1.2) {
        ph.fails += 1;
        this.story.stats.housekeeperFails += 1;
        this.failLevel(CHAPTER_IDS.housekeeper, "No disimulaste el miedo. Sonríe y reintenta el nivel.");
      }
    }
  }

  /** Retrato — ojos abiertos 15 s */
  playPortrait() {
    this.show("portrait");
    mountCharacter(document.getElementById("portraitChar"), "portrait");
    mountCharacter(this.refs.portraitFigure, "portrait");
    this.hub.eyes.reset();
    this.phase = { type: "portrait", progress: 0, entityShift: 0 };
    this.audio.startAmbient("tension");
    this.unsubs.push(
      this.hub.events.on(EV.EYES_CLOSED, () => {
        if (this.phase?.type === "portrait") {
          this.phase.entityShift += 8;
          this.story.stats.portraitBlinks += 1;
          this.audio.playStep();
          this.setStatus("El retrato se desplazó. No cierres los ojos.");
          setFlicker(true);
          this.timers.push(setTimeout(() => setFlicker(false), 400));
        }
      }),
    );
    this.setStatus("No parpadees · Palma abierta frena al retrato · Señala para concentrarte");
  }

  updatePortrait(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "portrait") return;
    const eye = this.hub.last?.eye ?? this.hub.eyes.analyze(dt);
    const gesture = this.hub.hand.getGesture();
    const handVis = this.hub.hand.isVisible();

    if (handVis && gesture === "open") {
      ph.entityShift = Math.max(0, ph.entityShift - dt * 3.5);
    }
    if (handVis && this.hub.hand.isPointingAt(0.5, 0.42, 0.16) && eye.open) {
      ph.progress += dt * 0.12;
    }
    if (handVis && gesture === "fist" && !eye.open) {
      ph.entityShift += dt * 4;
    }

    if (this.refs.portraitFigure) {
      this.refs.portraitFigure.style.transform = `translateX(${ph.entityShift}px)`;
    }
    const ghost = document.getElementById("portraitChar");
    if (ghost) ghost.style.transform = `translateX(${ph.entityShift * 1.4}px) scale(${1 + ph.entityShift * 0.002})`;
    if (eye.open) {
      ph.progress += dt;
      ph.entityShift = Math.max(0, ph.entityShift - dt * 2);
      this.setStatus(`Aguanta la mirada… ${Math.ceil(15 - ph.progress)}s`);
    } else {
      ph.progress = Math.max(0, ph.progress - dt * 0.6);
      this.setStatus(eye.message);
    }
    if (this.refs.stillFill) {
      this.refs.stillFill.style.width = `${Math.min(100, (ph.progress / 15) * 100)}%`;
    }
    if (ph.progress >= 15) {
      this.audio.playSuccess();
      this.story.completeChapter();
    }
    if (ph.entityShift > 120) {
      this.failLevel(CHAPTER_IDS.portrait, "El retrato te alcanzó. No parpadees y reintenta.");
    }
  }

  /** Sombra — mirar = criatura frena; desviar mirada = avanza */
  playWatcher() {
    this.show("watcher");
    mountCharacter(document.getElementById("watcherChar"), "hallCreature");
    this.phase = { type: "watcher", retreat: 0, creature: 72, creatureX: 0.78, creatureY: 0.52 };
    this.audio.startAmbient("tension");
    if (this.refs.creatureFigure) this.refs.creatureFigure.classList.remove("gaze-visible");
    this.unsubs.push(
      this.hub.events.on(EV.GAZE_OFF_THREAT, () => {
        if (this.phase?.type === "watcher") this.audio.playStep();
      }),
    );
    this.setStatus("Mira la sombra · Palma retrocede · Puño la atrae · Empuja para bloquear");
  }

  updateWatcher(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "watcher") return;
    const eye = this.hub.last?.eye ?? this.hub.eyes.analyze(dt);
    const looking = eye.open && (this.hub.last?.threat ?? this.hub.face.isLookingAtThreat());
    if (this.refs.creatureFigure) {
      this.refs.creatureFigure.classList.toggle("gaze-visible", looking);
    }
    const hand = this.hub.hand.getGesture();
    const handVis = this.hub.hand.isVisible();
    if (looking) {
      ph.retreat += dt * (hand === "open" ? 1.25 : 1);
      ph.creature = Math.max(28, ph.creature - dt * (hand === "push" && handVis ? 8 : 6));
      if (hand === "push" && handVis) ph.retreat += dt * 0.5;
      this.setStatus(hand === "push" ? "Empujas la sombra. Retrocede." : hand === "open" ? "Palma abierta — retrocedes más rápido." : "Bien. La mirada la fija.");
    } else {
      ph.creature = Math.min(95, ph.creature + dt * (hand === "fist" && handVis ? 14 : 12));
      ph.retreat = Math.max(0, ph.retreat - dt * 0.8);
      this.setStatus("¡Mira hacia la sombra! Ojos abiertos, cabeza hacia ella.");
      this.audio.setTensionLevel(0.5 + (ph.creature - 28) / 80);
    }
    if (this.refs.creatureFigure) {
      this.refs.creatureFigure.style.left = `${ph.creature}%`;
    }
    if (this.refs.stillFill) {
      this.refs.stillFill.style.width = `${Math.min(100, (ph.retreat / 12) * 100)}%`;
    }
    if (ph.creature >= 92) {
      this.failLevel(CHAPTER_IDS.watcher, "La sombra te alcanzó. Mírala y reintenta.");
    }
    if (ph.retreat >= 12) {
      this.audio.playSuccess();
      this.story.completeChapter();
    }
  }

  /** Silencio — boca cerrada (+ mic opcional) */
  playSilence() {
    this.show("silence");
    mountCharacter(document.getElementById("silenceChar"), "closetEar");
    this.hub.enableMic();
    this.phase = { type: "silence", progress: 0, noiseStrikes: 0 };
    this.audio.startAmbient("tension");
    this.unsubs.push(
      this.hub.events.on(EV.MOUTH_OPENED, () => {
        if (this.phase?.type === "silence") {
          this.story.stats.silenceBreaks += 1;
          this.setStatus("Escuchó tu aliento…");
        }
      }),
    );
    this.setStatus("Boca cerrada · Puño = aguantar · Palma abierta = amortiguar ruido");
  }

  updateSilence(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "silence") return;
    const mouth = this.hub.last?.mouth ?? this.hub.mouth.analyze(dt);
    const loud = this.hub.micLoud;
    if (!mouth.mouthOpen && !loud) {
      ph.progress += dt;
      this.setStatus(`Silencio… ${Math.ceil(10 - ph.progress)}s`);
    } else {
      ph.progress = Math.max(0, ph.progress - dt * (loud ? 1.2 : 0.7));
      this.setStatus(loud ? "¡Hiciste ruido!" : "Cierra la boca.");
      if (mouth.mouthOpen && mouth.jawOpen > 0.4) {
        ph.noiseStrikes += 1;
        this.audio.playScare();
        triggerGlitch(this.refs.glitchLayer);
        if (ph.noiseStrikes >= 4) {
          this.failLevel(CHAPTER_IDS.silence, "Te delataste. Guarda silencio y reintenta.");
        }
      }
    }
    const hGesture = this.hub.hand.getGesture();
    if (hGesture === "fist" && this.hub.hand.isVisible()) ph.progress += dt * 0.15;
    if (hGesture === "open" && this.hub.hand.isVisible() && loud) {
      ph.progress = Math.max(0, ph.progress - dt * 0.4);
      this.setStatus("Palma abierta amortigua… sigue en silencio.");
    }
    if (this.refs.stillFill) {
      this.refs.stillFill.style.width = `${Math.min(100, (ph.progress / 10) * 100)}%`;
    }
    if (ph.progress >= 10) {
      this.audio.playSuccess();
      this.story.completeChapter();
    }
  }

  /** Espejo — sonrisa vs reflejo */
  playReflection() {
    this.show("reflection");
    mountCharacter(document.getElementById("reflectionChar"), "double");
    this.phase = { type: "reflection", smileHold: 0, failTimer: 0 };
    this.refs.mirrorReflection?.classList.remove("strange", "smiling");
    this.unsubs.push(
      this.hub.events.on(EV.SMILE_DETECTED, () => {
        if (this.phase?.type === "reflection") this.setStatus("El reflejo titubea…");
      }),
    );
    this.setStatus("Sonríe · Imita con la mano lo que el espejo niega");
  }

  updateReflection(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "reflection") return;
    const mouth = this.hub.last?.mouth ?? this.hub.mouth.analyze(dt);
    const gesture = this.hub.hand.getGesture();
    const ref = this.refs.mirrorReflection;
    const mirrorHand = document.getElementById("reflectionHandHint");
    if (mirrorHand && this.hub.hand.isVisible()) {
      mirrorHand.textContent = gesture === "wave" ? "👋" : gesture === "open" ? "✋" : gesture === "fist" ? "✊" : gesture === "pinch" ? "🤏" : "👆";
      mirrorHand.classList.toggle("mirror-delay", gesture === "open" || gesture === "wave");
    } else if (mirrorHand) {
      mirrorHand.textContent = "—";
      mirrorHand.classList.remove("mirror-delay");
    }
    if (ref) {
      ref.classList.toggle("strange", !mouth.smiling);
      ref.classList.toggle("smiling", mouth.smiling);
    }
    if (mouth.smiling) {
      ph.smileHold += dt;
      if (gesture === "open" || gesture === "wave") ph.smileHold += dt * 0.2;
      this.setStatus(`El reflejo cede… ${Math.ceil(3.5 - ph.smileHold)}s`);
    } else {
      ph.smileHold = Math.max(0, ph.smileHold - dt * 0.45);
      ph.failTimer += dt;
      this.setStatus("Sonríe. Demuéstrale que eres humano.");
      if (ph.failTimer >= 12) {
        this.failLevel(CHAPTER_IDS.reflection, "El reflejo dudó de ti. Sonríe y reintenta.");
      }
    }
    if (mouth.smiling) ph.failTimer = 0;
    if (ph.smileHold >= 3.5) {
      this.audio.playSuccess();
      this.story.completeChapter();
    }
  }

  /** Juicio final — muestra puntuación y resuelve el final automáticamente */
  playJudgment() {
    this.show("judgment");
    mountCharacter(document.getElementById("judgmentChar"), "judge");
    const score = this.story.computeJudgmentScore();
    this.phase = {
      type: "judgment",
      elapsed: 0,
      resolved: false,
      autoSeconds: 5,
      score,
    };
    if (this.refs.judgmentScore) this.refs.judgmentScore.textContent = String(score);
    if (this.refs.judgmentDetails) {
      const s = this.story.stats;
      this.refs.judgmentDetails.innerHTML = `
        <li>Sonrisas acumuladas: ${s.smileSeconds.toFixed(1)}s</li>
        <li>Ojos abiertos: ${s.eyesOpenSeconds.toFixed(1)}s</li>
        <li>Tiempo observando: ${s.watchSeconds.toFixed(1)}s</li>
        <li>Silencio: ${s.mouthClosedSeconds.toFixed(1)}s</li>
        <li>Mano estable: ${s.handStableSeconds.toFixed(1)}s</li>
      `;
    }
    this.audio.startAmbient("tension");
    setTension(true);
    this.setStatus(`Puntuación ${score}. Sentencia en ${this.phase.autoSeconds}s…`);
  }

  updateJudgment(dt) {
    const ph = this.phase;
    if (!ph || ph.type !== "judgment" || ph.resolved) return;

    const face = this.hub.face.isVisible();
    const hand = this.hub.hand.isVisible();
    const rate = face && hand ? 1.25 : 1;
    ph.elapsed += dt * rate;

    const left = Math.max(0, ph.autoSeconds - ph.elapsed);
    if (left > 0.05) {
      this.setStatus(`Puntuación ${ph.score}. Sentencia en ${Math.ceil(left)}s…`);
    } else {
      ph.resolved = true;
      this.phase = null;
      setTension(false);
      this.setStatus("La casa ha decidido.");
      this.story.setEnding(this.story.resolveJudgment());
    }
  }

  showEnding(id) {
    this.show("ending");
    const data = ENDINGS[id];
    this.refs.endingTitle.textContent = data?.title ?? "Final";
    this.refs.endingBody.textContent = data?.body ?? "";
    this.audio.startAmbient("default");
    setTension(false);
  }

  update(dt) {
    if (!this.phase) return;
    switch (this.phase.type) {
      case "lantern":
        this.updateLantern(dt);
        break;
      case "housekeeper":
        this.updateHousekeeper(dt);
        break;
      case "portrait":
        this.updatePortrait(dt);
        break;
      case "watcher":
        this.updateWatcher(dt);
        break;
      case "silence":
        this.updateSilence(dt);
        break;
      case "reflection":
        this.updateReflection(dt);
        break;
      case "judgment":
        this.updateJudgment(dt);
        break;
      default:
        break;
    }
  }
}
