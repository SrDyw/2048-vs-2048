// Historial de partidas guardado en localStorage.

export type GameMode = "solo" | "vs";
export type GameResult = "win" | "lose" | "draw" | "solo";

export interface HistoryEntry {
  id: string;
  mode: GameMode;
  score: number;
  opponentScore?: number;
  result: GameResult;
  date: number;
  // Duracion de la partida en milisegundos.
  durationMs?: number;
}

const STORAGE_KEY = "2048_history_v1";
const MAX_ENTRIES = 50;

// Lee el historial guardado (o un array vacio).
export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Guarda el historial.
export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Si localStorage no esta disponible, ignoramos.
  }
}

// Mejor puntuacion de un modo concreto.
export function bestOf(entries: HistoryEntry[], mode: GameMode): number {
  return entries
    .filter((entry) => entry.mode === mode)
    .reduce((max, entry) => Math.max(max, entry.score), 0);
}

// Anade una partida al historial y devuelve la lista actualizada.
export function appendHistory(
  entries: HistoryEntry[],
  entry: Omit<HistoryEntry, "id" | "date">
): HistoryEntry[] {
  const full: HistoryEntry = {
    ...entry,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    date: Date.now(),
  };
  return [full, ...entries].slice(0, MAX_ENTRIES);
}
