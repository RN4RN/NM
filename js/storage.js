/** Claves y helpers de persistencia local. */

export const SAVE_KEY = "sombras_save_v1";

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* quota / privado */
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function createDefaultSave() {
  return {
    currentScene: "title",
    progress: 0,
    foundNotes: [],
    unlockedChapters: ["title"],
    completedOnce: false,
    endingSeen: null,
    stats: null,
  };
}

export function mergeSave(partial, base) {
  return { ...base, ...partial, foundNotes: partial.foundNotes ?? base.foundNotes };
}
