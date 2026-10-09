// Tipos y utilidades del protocolo de comunicacion entre clientes.
// La sincronizacion se hace sobre canales de presencia de Pusher.

import type { Tile } from "./game2048";

// Nombre del canal de presencia para una sala.
export function roomChannel(code: string): string {
  return `presence-game-${code}`;
}

// Nombre de los eventos emitidos por el servidor en el canal.
export type ServerEvent =
  | "room_probe"
  | "room_here"
  | "room_full"
  | "ready_update"
  | "countdown_start"
  | "game_start"
  | "opponent_board"
  | "opponent_game_over"
  | "match_result"
  | "rematch_requested"
  | "rematch_accepted"
  | "rematch_rejected"
  | "player_left";

export interface ReadyUpdatePayload {
  senderId: string;
  ready: boolean;
}

export interface CountdownStartPayload {
  from: number;
}

export interface GameStartPayload {
  seed: number;
}

export interface OpponentBoardPayload {
  senderId: string;
  tiles: Tile[];
  score: number;
}

export interface OpponentGameOverPayload {
  senderId: string;
  score: number;
}

export interface MatchResultPayload {
  winnerId: string | null;
  scores: Record<string, number>;
}

export interface RematchPayload {
  senderId: string;
}

export interface PlayerLeftPayload {
  senderId: string;
}

// Tokens de un mensaje que viaja al endpoint /api/game/event.
export interface TriggerRequest {
  code: string;
  event: ServerEvent;
  data: Record<string, unknown>;
}
