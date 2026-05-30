/**
 * Personajes de terror — siluetas y figuras por capítulo.
 */

export const CHARACTER_BY_SCENE = {
  title: "watcher",
  narrative: "whisper",
  ch_arrival: "doorGhost",
  int_lantern: "crawler",
  ch_housekeeper: "housekeeper",
  ch_portrait: "portrait",
  ch_watcher: "hallCreature",
  ch_silence: "closetEar",
  ch_reflection: "double",
  ch_judgment: "judge",
  ending: "watcher",
};

export const CHARACTER_BY_NARRATIVE = {
  ch_arrival: "doorGhost",
  ch_housekeeper_intro: "housekeeper",
  ch_portrait_intro: "portrait",
  ch_watcher_intro: "hallCreature",
  ch_silence_intro: "closetEar",
  ch_reflection_intro: "double",
  ch_judgment_intro: "judge",
};

/** SVG inline por personaje (estilo teatro de sombras) */
export const CHAR_SVG = {
  doorGhost: `<svg viewBox="0 0 120 200" class="charSvg" aria-hidden="true">
    <ellipse cx="60" cy="28" rx="22" ry="26" fill="#0a0808"/>
    <path d="M35 55 Q60 48 85 55 L78 195 Q60 188 42 195 Z" fill="#080606"/>
    <circle cx="50" cy="26" r="3" fill="#8a1f1f"/><circle cx="70" cy="26" r="3" fill="#8a1f1f"/>
    <path d="M48 38 Q60 44 72 38" stroke="#3a2020" fill="none" stroke-width="1.5"/>
  </svg>`,
  crawler: `<svg viewBox="0 0 160 80" class="charSvg" aria-hidden="true">
    <path d="M10 60 Q40 20 80 35 Q120 50 150 55" stroke="#120808" fill="none" stroke-width="18" stroke-linecap="round"/>
    <circle cx="145" cy="52" r="8" fill="#1a0505"/>
    <circle cx="142" cy="50" r="2" fill="#c03030"/>
  </svg>`,
  housekeeper: `<svg viewBox="0 0 100 220" class="charSvg" aria-hidden="true">
    <path d="M30 15 Q50 5 70 15 L75 45 Q50 38 25 45 Z" fill="#151018"/>
    <ellipse cx="50" cy="55" rx="18" ry="22" fill="#121015"/>
    <path d="M28 75 Q50 68 72 75 L68 210 Q50 205 32 210 Z" fill="#0c0a10"/>
    <circle cx="42" cy="52" r="4" fill="#b02020"/><circle cx="58" cy="52" r="4" fill="#b02020"/>
    <path d="M38 68 Q50 62 62 68" stroke="#502020" fill="none" stroke-width="1.2"/>
    <path d="M20 90 L15 140 M80 90 L85 140" stroke="#0a0808" stroke-width="6" stroke-linecap="round"/>
  </svg>`,
  portrait: `<svg viewBox="0 0 120 150" class="charSvg" aria-hidden="true">
    <rect x="8" y="8" width="104" height="134" rx="4" fill="#1a1410" stroke="#3a2820" stroke-width="2"/>
    <ellipse cx="60" cy="58" rx="28" ry="34" fill="#2a2018"/>
    <ellipse cx="48" cy="54" rx="5" ry="7" fill="#e8dcc8"/><ellipse cx="72" cy="54" rx="5" ry="7" fill="#e8dcc8"/>
    <circle cx="48" cy="55" r="2" fill="#1a0808"/><circle cx="72" cy="55" r="2" fill="#1a0808"/>
    <path d="M42 78 Q60 88 78 78" stroke="#1a0808" fill="none" stroke-width="2"/>
    <path d="M25 95 Q60 110 95 95" stroke="#120808" fill="none" stroke-width="1"/>
  </svg>`,
  hallCreature: `<svg viewBox="0 0 80 180" class="charSvg" aria-hidden="true">
    <path d="M40 8 Q55 25 48 45 Q62 70 55 100 Q70 130 40 175 Q10 130 25 100 Q18 70 32 45 Q25 25 40 8" fill="#030303"/>
    <ellipse cx="32" cy="38" rx="4" ry="5" fill="#601010"/><ellipse cx="48" cy="38" rx="4" ry="5" fill="#601010"/>
    <path d="M28 55 L22 90 M52 55 L58 85" stroke="#030303" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
  closetEar: `<svg viewBox="0 0 140 100" class="charSvg" aria-hidden="true">
    <rect x="20" y="10" width="100" height="80" rx="2" fill="#0d0b09" stroke="#1a1510" stroke-width="3"/>
    <ellipse cx="70" cy="88" rx="35" ry="8" fill="#050404"/>
    <path d="M55 50 Q70 35 85 50" stroke="#1a0808" fill="none" stroke-width="8" stroke-linecap="round"/>
    <circle cx="62" cy="48" r="3" fill="#401010"/><circle cx="78" cy="48" r="3" fill="#401010"/>
  </svg>`,
  double: `<svg viewBox="0 0 100 160" class="charSvg" aria-hidden="true">
    <ellipse cx="50" cy="45" rx="24" ry="30" fill="rgba(80,90,100,0.25)"/>
    <path d="M30 72 Q50 65 70 72 L65 155 Q50 150 35 155 Z" fill="rgba(60,70,80,0.2)"/>
    <circle cx="40" cy="42" r="3" fill="rgba(200,40,40,0.6)"/><circle cx="60" cy="42" r="3" fill="rgba(200,40,40,0.6)"/>
    <path d="M38 58 L62 58" stroke="rgba(180,40,40,0.5)" stroke-width="2"/>
  </svg>`,
  judge: `<svg viewBox="0 0 200 160" class="charSvg" aria-hidden="true">
    <path d="M20 140 Q100 20 180 140" fill="none" stroke="#1a0808" stroke-width="2" opacity="0.5"/>
    <circle cx="60" cy="70" r="8" fill="#2a1010"/><circle cx="100" cy="50" r="10" fill="#3a1515"/>
    <circle cx="140" cy="70" r="8" fill="#2a1010"/><circle cx="80" cy="100" r="6" fill="#201010"/>
    <circle cx="120" cy="95" r="6" fill="#201010"/>
  </svg>`,
  whisper: `<svg viewBox="0 0 90 140" class="charSvg" aria-hidden="true">
    <path d="M45 10 Q60 30 55 55 Q70 80 45 130 Q20 80 35 55 Q30 30 45 10" fill="#080608" opacity="0.85"/>
    <circle cx="38" cy="48" r="2.5" fill="#601818"/><circle cx="52" cy="48" r="2.5" fill="#601818"/>
  </svg>`,
  watcher: `<svg viewBox="0 0 60 120" class="charSvg" aria-hidden="true">
    <ellipse cx="30" cy="25" rx="14" ry="16" fill="#050404"/>
    <path d="M18 40 Q30 36 42 40 L38 115 Q30 112 22 115 Z" fill="#030303"/>
    <circle cx="24" cy="24" r="2" fill="#801515"/><circle cx="36" cy="24" r="2" fill="#801515"/>
  </svg>`,
};

export function mountCharacter(el, id, mood = "") {
  if (!el) return;
  const svg = CHAR_SVG[id] ?? CHAR_SVG.whisper;
  el.innerHTML = svg;
  el.dataset.char = id;
  el.classList.toggle("horrorChar--tense", mood === "tense");
  el.classList.toggle("horrorChar--calm", mood === "calm");
}

export function setNarrativeCharacter(narrativeKey) {
  const el = document.getElementById("narrativeChar");
  const id = CHARACTER_BY_NARRATIVE[narrativeKey] ?? "whisper";
  mountCharacter(el, id);
}
