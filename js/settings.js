/** Ajustes del jugador (persistidos en localStorage). */

export const SETTINGS_KEY = "sombras_settings_v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return createDefaultSettings();
    return { ...createDefaultSettings(), ...JSON.parse(raw) };
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* noop */
  }
}

export function createDefaultSettings() {
  return {
    /** 0 = menos sensible · 100 = más sensible */
    blinkSensitivity: 70,
  };
}

/** Convierte 0–100 en umbrales de detección */
export function sensitivityToThresholds(value) {
  const t = Math.max(0, Math.min(100, value)) / 100;
  return {
    blinkThreshold: 0.54 - t * 0.38,
    earThreshold: 0.09 + t * 0.14,
  };
}
