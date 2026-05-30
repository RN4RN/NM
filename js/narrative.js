/** Textos narrativos de la casa. */

export const NARRATIVE = {
  ch_arrival: {
    chapter: "La casa",
    lines: [
      "La puerta cedió sin resistencia, como si te esperara.",
      "Dentro, el polvo flotaba en columnas de luz enferma.",
      "Algo en el silencio te observaba antes de que entraras.",
      "Tu mano tembló al tocar la pared. La cámara sigue encendida. ¿Por qué?",
    ],
    hint: "Algo está oculto. Solo tu mano trae luz.",
    next: "int_lantern",
  },
  ch_housekeeper_intro: {
    chapter: "La ama de casa",
    lines: [
      "Al fondo del salón, una mujer permanece inmóvil.",
      "No parpadea. No respira. Solo mira.",
      "Susurra sin mover los labios: «Hueles a miedo».",
      "Si quiere dejarte pasar, debe creer que estás tranquilo.",
    ],
    hint: "Sonríe. Finge calma. Engaña a la muerte.",
    next: "ch_housekeeper_play",
  },
  ch_portrait_intro: {
    chapter: "No parpadees",
    lines: [
      "Un retrato antiguo cuelga torcido en el rellano.",
      "Los ojos pintados parecen de carne.",
      "Cada vez que cierras los tuyos… él se acerca un poco.",
      "Quince segundos. Eso es todo lo que pide la casa.",
    ],
    hint: "No cierres los ojos. Ni un instante.",
    next: "ch_portrait_play",
  },
  ch_watcher_intro: {
    chapter: "La sombra observadora",
    lines: [
      "Al final del pasillo, algo se arrastra fuera de la luz.",
      "Solo avanza cuando dejas de mirarlo.",
      "Retrocede despacio, pero no apartes la vista.",
      "Si lo pierdes de vista, te alcanza.",
    ],
    hint: "Mira la sombra con la cabeza. Palma abierta = retroceder.",
    next: "ch_watcher_play",
  },
  ch_silence_intro: {
    chapter: "No hagas ruido",
    lines: [
      "Te escondes en un armario. La madera apesta a encierro.",
      "Pasos húmedos se detienen junto a la puerta.",
      "Escucha. Cualquier sonido — incluso tu aliento — delata dónde estás.",
      "Cierra la boca. Contén el miedo.",
    ],
    hint: "Boca cerrada. Diez segundos de silencio absoluto.",
    next: "ch_silence_play",
  },
  ch_reflection_intro: {
    chapter: "El reflejo",
    lines: [
      "El espejo del dormitorio no refleja la habitación.",
      "Refleja a alguien que se parece a ti… pero no sonríe cuando tú sonríes.",
      "La casa duda si eres humano.",
      "Demuéstralo. Sonríe como si aún tuvieras esperanza.",
    ],
    hint: "Sonríe frente al espejo. Que el reflejo se atrevida a imitarte.",
    next: "ch_reflection_play",
  },
  ch_judgment_intro: {
    chapter: "El juicio",
    lines: [
      "Todas las puertas se abren a la vez.",
      "La casa te muestra cada habitación donde fallaste… o resististe.",
      "Una voz sin origen enumera tu comportamiento.",
      "Ahora decide si eres huésped, prisionero o parte del mobiliario.",
    ],
    hint: "Mira la puntuación. La sentencia llegará en unos segundos.",
    next: "ch_judgment_play",
  },
};

export function typewriter(el, lines, speed = 36) {
  el.innerHTML = "";
  const full = lines.join("\n\n");
  return new Promise((resolve) => {
    let i = 0;
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    const tick = () => {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        el.appendChild(cursor);
        i += 1;
        setTimeout(tick, speed + Math.random() * 28);
      } else resolve();
    };
    tick();
  });
}
