// Guardado y recuperacion de la partida en solitario en localStorage.

import type { SavedGame } from "./game2048";

const KEY = "2048_solo_save_v1";

// Guarda el estado actual de la partida en solitario.
export function saveSoloGame(state: SavedGame): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignoramos si localStorage no esta disponible.
  }
}

// Carga la partida guardada (o null si no hay).
export function loadSoloGame(): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    // Descarta partidas ya terminadas.
    if (!parsed || parsed.gameOver) return null;
    if (!Array.isArray(parsed.tiles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Indica si existe una partida en solitario guardada y sin terminar.
export function hasSoloSave(): boolean {
  return loadSoloGame() !== null;
}

// Borra la partida guardada.
export function clearSoloGame(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignoramos.
  }
}
