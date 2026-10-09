import { atom } from "nanostores";
import type { SavedGame, Tile } from "@/lib/game2048";
import {
  appendHistory,
  bestOf,
  loadHistory,
  saveHistory,
  type HistoryEntry,
  type GameMode,
} from "@/lib/history";

// Fases de la aplicacion.
export type Phase =
  | "home"
  | "lobby"
  | "countdown"
  | "playing"
  | "waiting"
  | "solo-result"
  | "result";

export interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

export interface MatchResult {
  winnerId: string | null; // null => empate
  scores: Record<string, number>;
}

// ----- Estado global reactivo -----
export const $phase = atom<Phase>("home");
export const $roomCode = atom<string>("");
export const $myId = atom<string>("");
export const $isHost = atom<boolean>(false);
export const $players = atom<PlayerInfo[]>([]);
export const $connected = atom<boolean>(false);
// Indica que nuestra propia conexion se esta restableciendo.
export const $reconnecting = atom<boolean>(false);
// Estado del rival respecto a la conexion.
export const $opponentStatus = atom<"online" | "reconnecting" | "left">(
  "online"
);
export const $seed = atom<number | null>(null);
export const $countdownFrom = atom<number>(3);
// Momento (ms) en que empezo la partida en curso, para medir su duracion.
export const $sessionStart = atom<number>(0);

// Tableros y puntuaciones.
export const $myScore = atom<number>(0);
export const $myTiles = atom<Tile[]>([]);
export const $opponentTiles = atom<Tile[]>([]);
export const $opponentScore = atom<number>(0);
export const $opponentOver = atom<boolean>(false);
export const $myOver = atom<boolean>(false);

// Resultado y revancha.
export const $result = atom<MatchResult | null>(null);
export const $rematchRequested = atom<boolean>(false);
export const $rematchRejected = atom<boolean>(false);
export const $rematchPending = atom<boolean>(false);

// Indica que hay una accion en curso (para mostrar spinners en los botones).
export const $busy = atom<boolean>(false);

// Errores discretos de UI (crear/unirse a sala).
export const $error = atom<string>("");

// Modo un jugador (sin rival ni Pusher).
export const $solo = atom<boolean>(false);
// Partida guardada que se va a continuar (si la hay).
export const $soloSaved = atom<SavedGame | null>(null);
// Identificador de ronda en solitario, para remontar el tablero.
export const $soloRound = atom<number>(0);

// Nombre del jugador (se puede cambiar antes de crear/unirse).
export const $playerName = atom<string>("");

// Historial de partidas y mejores puntuaciones.
export const $history = atom<HistoryEntry[]>([]);
export const $bestSolo = atom<number>(0);
export const $bestVs = atom<number>(0);
export const $newRecord = atom<boolean>(false);

// Carga el historial desde localStorage (llamar en el cliente).
export function initHistory(): void {
  const entries = loadHistory();
  $history.set(entries);
  $bestSolo.set(bestOf(entries, "solo"));
  $bestVs.set(bestOf(entries, "vs"));
}

// Registra una partida terminada. Devuelve true si es un nuevo record.
export function recordMatch(entry: {
  mode: GameMode;
  score: number;
  opponentScore?: number;
  result: HistoryEntry["result"];
  durationMs?: number;
}): boolean {
  const entries = appendHistory($history.get(), entry);
  $history.set(entries);
  saveHistory(entries);

  const prevBest = entry.mode === "solo" ? $bestSolo.get() : $bestVs.get();
  const isRecord = entry.score > prevBest;
  $newRecord.set(isRecord);

  if (entry.mode === "solo") {
    $bestSolo.set(Math.max(prevBest, entry.score));
  } else {
    $bestVs.set(Math.max(prevBest, entry.score));
  }
  return isRecord;
}

// Reinicia el estado de la partida conservando la sala.
export function resetMatchState(): void {
  $myScore.set(0);
  $myTiles.set([]);
  $opponentTiles.set([]);
  $opponentScore.set(0);
  $opponentOver.set(false);
  $myOver.set(false);
  $result.set(null);
  $rematchRequested.set(false);
  $rematchRejected.set(false);
  $rematchPending.set(false);
  $seed.set(null);
  $countdownFrom.set(3);
  $sessionStart.set(0);
  $opponentStatus.set("online");
  // Vuelve a marcar a todos como no listos para la revancha.
  $players.set($players.get().map((p) => ({ ...p, ready: false })));
}

// Reset completo al salir al inicio.
export function resetAll(): void {
  resetMatchState();
  $phase.set("home");
  $roomCode.set("");
  $myId.set("");
  $isHost.set(false);
  $players.set([]);
  $opponentStatus.set("online");
  $error.set("");
  $solo.set(false);
  $soloSaved.set(null);
}
