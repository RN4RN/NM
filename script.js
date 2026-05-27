const $ = (sel) => document.querySelector(sel);

const state = {
  nodeId: "intro",
  chapter: 1,
  lastLine: "",
  gameDone: {},
  maze: null,
};

/** Laberintos: # pared, . pasillo, S inicio, G meta */
const MAZES = {
  to_table: {
    title: "☕ Llegar a la mesa",
    sub: "Entraste a la cafetería. Llega al asiento del fondo (🪑).",
    badge: "🪑 Mesa",
    goalEmoji: "🪑",
    rows: [
      "#########",
      "#S.....G#",
      "#.#####.#",
      "#.#...#.#",
      "#.#.#.#.#",
      "#...#...#",
      "#########",
    ],
  },
  to_star: {
    title: "⭐ Buscar la estrella",
    sub: "La cafetería casi vacía. Llega a la estrella de papel (⭐).",
    badge: "⭐ Estrella",
    goalEmoji: "⭐",
    rows: [
      "#########",
      "#S......#",
      "###.###.#",
      "#...#...#",
      "#.###.###",
      "#.....G.#",
      "#########",
    ],
  },
};

const STORY = {
  intro: {
    chapter: 1,
    cap: "🌙 Inicio",
    line:
      "La ciudad estaba en silencio. Las luces de algunas ventanas seguían encendidas, los autos pasaban cada vez menos y el frío de la noche cubría las calles.\n\nParecía una noche cualquiera… hasta que encontraste una pequeña cafetería que nunca habías visto antes.\n\nNo tenía nombre. No aparecía en ningún mapa. Y aun así, sentías que debías entrar.\n\nCuando abriste la puerta, una campanita sonó suavemente. Dentro olía a café recién hecho, chocolate caliente y lluvia de invierno. Había música tranquila.\n\nY al fondo… alguien levantó la mirada como si te hubiera estado esperando. Sonrió y señaló el asiento frente a ella.",
    next: "seat_q",
  },
  seat_q: {
    chapter: 1,
    cap: "☕ ¿Te sientas?",
    line: "¿Te sientas?",
    yes: "sit_yes",
    no: "window",
    yesLabel: "✅ Sí",
    noLabel: "🪟 No (ventana)",
  },
  sit_yes: {
    chapter: 1,
    cap: "🌧️ Te sentaste",
    line:
      "Te sentaste lentamente. La lluvia golpeaba las ventanas y las luces amarillas hacían que todo pareciera un sueño.\n\nDejaron una taza caliente sobre la mesa:\n\n— “Pensé que quizá hoy necesitarías compañía.”\n\nNo sabías por qué, pero escuchar eso calmó un poco tu corazón. Luego sacaron una pequeña nota doblada.",
    next: "note_q",
    game: "to_table",
  },
  note_q: {
    chapter: 2,
    cap: "📖 ¿Lees la nota?",
    line: "¿Lees la nota?",
    yes: "note_read",
    no: "words_saved",
    yesLabel: "✅ Sí",
    noLabel: "📦 No (guardarla)",
  },
  note_read: {
    chapter: 2,
    cap: "💌 La nota",
    line:
      "Abriste la nota lentamente. La letra era sencilla, pero cada palabra iba con cuidado:\n\n“Algunas personas llegan a tu vida haciendo ruido. Otras llegan como la noche: en silencio… y aun así logran quedarse.”\n\nDebajo:\n\n“Espero que hoy hayas sonreído aunque sea un poquito.”\n\nSentiste paz. Te miraban con calma, sin prisa por irse.",
    next: "talk_q",
  },
  words_saved: {
    chapter: 2,
    cap: "📖 Palabras guardadas",
    line:
      "Guardaste la nota sin leerla. La persona sonrió levemente:\n\n— “Hay mensajes que llegan justo cuando más los necesitamos.”",
    yes: "conversation",
    no: "rain_night",
    yesLabel: "✅ Sí, cuéntame",
    noLabel: "🌧️ No, solo lluvia",
  },
  talk_q: {
    chapter: 2,
    cap: "💬 ¿Seguir hablando?",
    line: "¿Quieres seguir hablando?",
    yes: "conversation",
    no: "early_goodbye",
    yesLabel: "✅ Sí",
    noLabel: "🌙 Despedida temprana",
  },
  conversation: {
    chapter: 3,
    cap: "☕ La conversación",
    line:
      "Hablaron durante horas: de sueños, canciones, recuerdos que aún dolían un poco y de cosas que casi nadie cuenta.\n\nA veces reían. A veces solo escuchaban la lluvia. Era un silencio bonito.\n\nEntonces dijeron algo inesperado:\n\n— “Hay personas que aparecen para cambiarte la vida… y otras que aparecen solo para recordarte que mereces ser querida.”",
    next: "why_q",
  },
  why_q: {
    chapter: 3,
    cap: "❓ ¿Preguntas por qué?",
    line: "¿Le preguntas por qué dijo eso?",
    yes: "answer",
    no: "silence",
    yesLabel: "✅ Sí",
    noLabel: "🤫 Silencio bonito",
  },
  answer: {
    chapter: 3,
    cap: "💙 La respuesta",
    line:
      "Sonrió un poco antes de responder:\n\n— “Porque a veces olvidamos lo valiosos que somos.”\n\nMiró la lluvia unos segundos:\n\n— “Y porque quizá alguien necesitaba recordarte esta noche que merece descansar sin preocupaciones.”\n\nEn voz baja agregó:\n\n“Especialmente tú, Mishel.”\n\nLa lluvia sonó más suave. La cafetería, más cálida. El tiempo dejó de importar un momento.",
    next: "stay_q",
  },
  silence: {
    chapter: 3,
    cap: "🌌 Silencio bonito",
    line:
      "No preguntaste nada. Y aun así parecía que ambas entendían el momento. Hay conexiones que no necesitan demasiadas palabras.",
    yes: "last_moment",
    no: "slow_end",
    yesLabel: "✅ Quedarme hasta el cierre",
    noLabel: "🌙 Irme despacio",
  },
  stay_q: {
    chapter: 4,
    cap: "⏳ ¿Te quedas?",
    line: "¿Te quedas un rato más?",
    yes: "last_moment",
    no: "moon_path",
    yesLabel: "✅ Sí",
    noLabel: "🌙 Camino de la luna",
  },
  moon_path: {
    chapter: 4,
    cap: "🌙 Camino de la luna",
    line:
      "Te fuiste un poco antes, bajo la lluvia que ya amainaba. Aun así, el corazón iba más ligero que cuando llegaste.",
    next: "last_moment",
  },
  last_moment: {
    chapter: 4,
    cap: "✨ Último momento",
    line:
      "Las horas pasaron sin notarlo. La cafetería casi vacía. La música, despacio.\n\nDejaron una pequeña estrella de papel frente a ti:\n\n— “Para que recuerdes algo.”",
    next: "star_q",
    game: "to_star",
  },
  star_q: {
    chapter: 4,
    cap: "⭐ ¿La abres?",
    line: "¿La abres?",
    yes: "stars_final",
    no: "star_closed",
    yesLabel: "✅ Sí",
    noLabel: "📦 No (guardarla)",
  },
  stars_final: {
    chapter: 5,
    cap: "✨ Final de las estrellas",
    line:
      "Abriste la estrella de papel. Dentro decía:\n\n“Ojalá mañana la vida te trate bonito.”\n\nY debajo:\n\n“Y si el día se pone difícil… recuerda que incluso las noches más oscuras terminan llenándose de luz.”\n\nSonrió una última vez. La lluvia afuera se detuvo. La cafetería empezó a desvanecerse como un sueño tranquilo.\n\nAntes de que todo se fuera, escuchaste una última voz:\n\n🌙 Buenas noches, Mishel.\nDescansa bonito.\nQue tus sueños sean tranquilos, que tu corazón descanse y que mañana la vida te regale motivos para sonreír.\n\nY si algún día te sientes cansada del mundo… recuerda que incluso las estrellas necesitan oscuridad para brillar. ✨\n\n💙",
    end: true,
  },
  star_closed: {
    chapter: 5,
    cap: "⭐ Estrella cerrada",
    line:
      "No abriste la estrella. La guardaste contigo, para otro día u otra noche difícil.\n\nAntes de irte, escuchaste suavemente:\n\n🌙 Buenas noches, Mishel.\nOjalá descanses bonito esta noche.\nQue mañana despiertes con menos preocupaciones y más sonrisas.\n\n💙",
    end: true,
  },
  window: {
    chapter: 1,
    cap: "🌧️ Ventana",
    line:
      "Decidiste no sentarte. Observaste la lluvia desde la ventana.\n\nAntes de irte, dijeron:\n\n— “Está bien… algunas historias necesitan más tiempo para comenzar.”",
    yes: "seat_q",
    no: "night_silence",
    yesLabel: "✅ Volver",
    noLabel: "🌙 Seguir en silencio",
  },
  night_silence: {
    chapter: 1,
    cap: "🌙 Noche en silencio",
    line: "La noche siguió en silencio. La lluvia acompañó el camino a casa.",
    end: true,
  },
  early_goodbye: {
    chapter: 2,
    cap: "🌙 Despedida temprana",
    line:
      "Te marchaste temprano. No intentaron detenerte. Solo dijeron:\n\n“Espero que esta noche puedas descansar en paz, Mishel.”\n\nSaliste bajo la lluvia… y el corazón se sintió un poco más ligero.",
    end: true,
  },
  rain_night: {
    chapter: 2,
    cap: "🌧️ Lluvia",
    line: "La lluvia acompañó el resto de la noche. A veces eso también es compañía.",
    end: true,
  },
  slow_end: {
    chapter: 3,
    cap: "🌙 Noche lenta",
    line: "La noche terminó despacio. Sin prisa. Con la ciudad dormida y el corazón en calma.",
    end: true,
  },
};

const els = {
  storyTitle: $("#storyTitle"),
  subtitle: $("#subtitle"),
  line: $("#line"),
  lineMeta: $("#lineMeta"),
  yes: $("#yesBtn"),
  no: $("#noBtn"),
  yesLabel: $("#yesLabel"),
  noLabel: $("#noLabel"),
  choices: $("#choices"),
  continueRow: $("#continueRow"),
  continueBtn: $("#continueBtn"),
  restart: $("#restart"),
  pill: $("#chapterPill"),
  toast: $("#toast"),
  copyLine: $("#copyLine"),
  canvas: $("#hearts"),
  bubble: $("#bubble"),
  level: $("#level"),
  levelTitle: $("#levelTitle"),
  levelSub: $("#levelSub"),
  levelBadge: $("#levelBadge"),
  levelHint: $("#levelHint"),
  levelContinue: $("#levelContinue"),
  gridMaze: $("#gridMaze"),
};

function node() {
  return STORY[state.nodeId];
}

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function typeLine(text) {
  state.lastLine = text.replace(/\n/g, " ");
  els.line.textContent = "";
  els.line.style.whiteSpace = "pre-wrap";
  let i = 0;
  const speed = 10;
  const tick = () => {
    i += 1;
    els.line.textContent = text.slice(0, i);
    if (i < text.length) window.setTimeout(tick, speed);
  };
  tick();
}

function pulseBubble() {
  els.bubble.animate(
    [
      { transform: "translateY(0px)" },
      { transform: "translateY(-2px)" },
      { transform: "translateY(0px)" },
    ],
    { duration: 480, easing: "cubic-bezier(.2,.9,.2,1)" },
  );
}

function setChoicesVisible(on) {
  els.choices.style.opacity = on ? "1" : "0";
  els.choices.style.pointerEvents = on ? "auto" : "none";
}

function setContinueVisible(on) {
  els.continueRow.classList.toggle("show", on);
  els.continueBtn.disabled = !on;
}

function gameKey(gameId) {
  return `${state.nodeId}:${gameId}`;
}

function needsGame(n) {
  if (!n.game) return false;
  return !state.gameDone[gameKey(n.game)];
}

function render() {
  const n = node();
  if (!n) return;

  state.chapter = n.chapter ?? state.chapter;
  els.pill.textContent = n.cap ?? `☕ Cap. ${state.chapter}`;
  typeLine(n.line);
  els.lineMeta.textContent = `${nowTime()}`;

  const inGame = needsGame(n);
  els.level.classList.toggle("show", inGame);

  if (inGame) {
    setChoicesVisible(false);
    setContinueVisible(false);
    if (!state.maze || state.maze.id !== n.game) startMaze(n.game);
    return;
  }

  const question = typeof n.yes === "string" && typeof n.no === "string" && !n.end;
  const cont = !!n.next && !n.end;

  setChoicesVisible(question);
  els.yes.disabled = !question;
  els.no.disabled = !question;
  if (question) {
    els.yesLabel.textContent = n.yesLabel ?? "✅ Sí";
    els.noLabel.textContent = n.noLabel ?? "🚪 No";
  }

  setContinueVisible(cont && !question);
  if (n.end) {
    setContinueVisible(false);
    setChoicesVisible(false);
    els.subtitle.textContent = "Fin de la historia. Puedes reiniciar cuando quieras. 💙";
    launchHearts(28);
  } else if (question) {
    els.subtitle.textContent = "Responde con los botones. ✅ Sí  ·  🚪 No";
  } else {
    els.subtitle.textContent = "Cuando quieras, pulsa Continuar. 📖";
  }

  pulseBubble();
}

function goTo(id) {
  state.nodeId = id;
  render();
}

function onYes() {
  const n = node();
  if (n.yes) {
    launchHearts(10);
    goTo(n.yes);
  }
}

function onNo() {
  const n = node();
  if (n.no) {
    gentleShake();
    goTo(n.no);
  }
}

function onContinue() {
  const n = node();
  if (n.next) {
    launchHearts(6);
    goTo(n.next);
  }
}

function restart() {
  state.nodeId = "intro";
  state.chapter = 1;
  state.gameDone = {};
  state.maze = null;
  showToast("🔄 Historia reiniciada");
  render();
}

function gentleShake() {
  els.bubble.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 380, easing: "ease-out" },
  );
}

function copyLastLine() {
  if (!state.lastLine) return;
  navigator.clipboard
    ?.writeText(state.lastLine)
    .then(() => showToast("📋 Copiado"))
    .catch(() => showToast("No se pudo copiar"));
}

/* ——— Laberinto por casillas ——— */
function parseMaze(def) {
  const grid = def.rows.map((row) => row.split(""));
  let start = { r: 0, c: 0 };
  let goal = { r: 0, c: 0 };
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (grid[r][c] === "S") {
        start = { r, c };
        grid[r][c] = ".";
      }
      if (grid[r][c] === "G") {
        goal = { r, c };
        grid[r][c] = ".";
      }
    }
  }
  return { grid, start, goal, def };
}

function startMaze(id) {
  const def = MAZES[id];
  if (!def) return;
  const parsed = parseMaze(def);
  state.maze = {
    id,
    ...parsed,
    player: { ...parsed.start },
  };
  els.levelTitle.textContent = def.title;
  els.levelSub.textContent = def.sub;
  els.levelBadge.textContent = def.badge;
  els.levelContinue.disabled = true;
  els.levelHint.textContent = "⬆️⬇️⬅️➡️ Llega a " + def.goalEmoji;
  drawMaze();
}

function drawMaze() {
  const m = state.maze;
  if (!m) return;
  const { grid, player, goal, def } = m;
  els.gridMaze.innerHTML = "";
  els.gridMaze.style.gridTemplateColumns = `repeat(${grid[0].length}, 1fr)`;

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const ch = grid[r][c];
      if (ch === "#") {
        cell.classList.add("cell-wall");
        cell.textContent = "🧱";
      } else {
        cell.classList.add("cell-floor");
        if (player.r === r && player.c === c) {
          cell.classList.add("cell-player");
          cell.textContent = "🌸";
        } else if (goal.r === r && goal.c === c) {
          cell.classList.add("cell-goal");
          cell.textContent = def.goalEmoji;
        } else {
          cell.textContent = "";
        }
      }
      els.gridMaze.appendChild(cell);
    }
  }
}

function movePlayer(dr, dc) {
  const m = state.maze;
  if (!m) return;
  const nr = m.player.r + dr;
  const nc = m.player.c + dc;
  const row = m.grid[nr];
  if (!row) return;
  if (row[nc] === "#") {
    showToast("🧱 Pared");
    return;
  }
  m.player = { r: nr, c: nc };
  drawMaze();
  if (nr === m.goal.r && nc === m.goal.c) {
    els.levelContinue.disabled = false;
    els.levelHint.textContent = "✨ Llegaste. Pulsa «Seguir historia».";
    launchHearts(16);
    showToast("✨ ¡Lo lograste!");
  }
}

function finishMaze() {
  const n = node();
  if (!n.game) return;
  state.gameDone[gameKey(n.game)] = true;
  state.maze = null;
  els.level.classList.remove("show");
  showToast("☕ Siguiente escena");
  render();
}

/* Hearts */
const hearts = { ctx: null, particles: [], raf: null };

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = els.canvas.getBoundingClientRect();
  els.canvas.width = Math.floor(rect.width * dpr);
  els.canvas.height = Math.floor(rect.height * dpr);
  hearts.ctx = els.canvas.getContext("2d");
  hearts.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function heartPath(ctx, x, y, size) {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.28);
  ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.28);
  ctx.bezierCurveTo(x - s, y + s * 0.58, x - s * 0.58, y + s * 0.9, x, y + s);
  ctx.bezierCurveTo(x + s * 0.58, y + s * 0.9, x + s, y + s * 0.58, x + s, y + s * 0.28);
  ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.28);
  ctx.closePath();
}

function launchHearts(count = 12) {
  const rect = els.canvas.getBoundingClientRect();
  for (let i = 0; i < count; i += 1) {
    hearts.particles.push({
      x: rect.width * (0.35 + Math.random() * 0.3),
      y: rect.height * (0.55 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 0.6,
      vy: -1.2 - Math.random() * 1.3,
      r: 7 + Math.random() * 10,
      a: 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.12,
      hue: 300 + Math.random() * 40,
    });
  }
  if (!hearts.raf) tickHearts();
}

function tickHearts() {
  hearts.raf = requestAnimationFrame(tickHearts);
  const ctx = hearts.ctx;
  if (!ctx) return;
  const rect = els.canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  hearts.particles = hearts.particles.filter((p) => p.a > 0.02 && p.y > -40);
  for (const p of hearts.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.vx *= 0.995;
    p.a *= 0.986;
    p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.a;
    ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, 0.9)`;
    heartPath(ctx, 0, 0, p.r);
    ctx.fill();
    ctx.restore();
  }
  if (hearts.particles.length === 0) {
    cancelAnimationFrame(hearts.raf);
    hearts.raf = null;
  }
}

function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });

  els.yes.addEventListener("click", onYes);
  els.no.addEventListener("click", onNo);
  els.continueBtn.addEventListener("click", onContinue);
  els.restart.addEventListener("click", restart);
  els.copyLine.addEventListener("click", (e) => {
    e.preventDefault();
    copyLastLine();
  });
  els.levelContinue.addEventListener("click", finishMaze);

  document.querySelectorAll(".padBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.dataset.dir;
      if (d === "up") movePlayer(-1, 0);
      if (d === "down") movePlayer(1, 0);
      if (d === "left") movePlayer(0, -1);
      if (d === "right") movePlayer(0, 1);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (state.maze) {
      if (e.key === "ArrowUp") movePlayer(-1, 0);
      if (e.key === "ArrowDown") movePlayer(1, 0);
      if (e.key === "ArrowLeft") movePlayer(0, -1);
      if (e.key === "ArrowRight") movePlayer(0, 1);
      return;
    }
    if (e.key === "ArrowRight" || e.key === "y") onYes();
    if (e.key === "ArrowLeft" || e.key === "n") onNo();
    if (e.key === "Enter") onContinue();
    if (e.key.toLowerCase() === "r") restart();
  });

  render();
  setTimeout(() => launchHearts(8), 500);
}

init();
