import { atom } from "nanostores";
import type { Tile } from "@/lib/game2048";

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
export const $seed = atom<number | null>(null);
export const $countdownFrom = atom<number>(3);

// Tableros y puntuaciones.
export const $myScore = atom<number>(0);
export const $opponentTiles = atom<Tile[]>([]);
export const $opponentScore = atom<number>(0);
export const $opponentOver = atom<boolean>(false);
export const $myOver = atom<boolean>(false);

// Resultado y revancha.
export const $result = atom<MatchResult | null>(null);
export const $rematchRequested = atom<boolean>(false);
export const $rematchRejected = atom<boolean>(false);
export const $rematchPending = atom<boolean>(false);
export const $opponentLeft = atom<boolean>(false);

// Indica que hay una accion en curso (para mostrar spinners en los botones).
export const $busy = atom<boolean>(false);

// Errores discretos de UI (crear/unirse a sala).
export const $error = atom<string>("");

// Modo un jugador (sin rival ni Pusher).
export const $solo = atom<boolean>(false);

// Reinicia el estado de la partida conservando la sala.
export function resetMatchState(): void {
  $myScore.set(0);
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
  $opponentLeft.set(false);
  $error.set("");
  $solo.set(false);
}
