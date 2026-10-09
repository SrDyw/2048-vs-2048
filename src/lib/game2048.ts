// Logica pura del juego 2048. Sin dependencias del DOM para poder testearse.
// Cada ficha mantiene un id estable para poder animar su deslizamiento.

import { createRng, rngInt, rngNext, type RngState } from "./prng";

export const BOARD_SIZE = 4;

export type Direction = "up" | "down" | "left" | "right";

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  // Marca de ficha recien aparecida (animacion de fundido).
  isNew?: boolean;
  // Marca de ficha resultado de una fusion.
  merged?: boolean;
  // Indica si la ficha cambio de posicion en el ultimo movimiento.
  // Solo estas fichas deslizan; el resto permanece estatico.
  moving?: boolean;
}

export interface GameSnapshot {
  tiles: Tile[];
  score: number;
}

// Estado serializable de una partida (para guardarla y continuarla).
export interface SavedGame {
  rngState: RngState;
  nextId: number;
  tiles: Tile[];
  score: number;
  gameOver: boolean;
}

export interface MoveResult {
  moved: boolean;
  // Fase 1 de la animacion: fichas deslizandose (sin fusionar todavia).
  slideTiles: Tile[];
  // Fase 2: fichas tras aplicar fusiones y generar la nueva ficha.
  finalTiles: Tile[];
  scoreGained: number;
}

type Coord = [number, number];

// Definicion de una linea de movimiento: celdas ordenadas desde el borde
// hacia el que se mueve (cerca -> lejos) y su celda destino por indice.
interface LineDef {
  coords: Coord[];
  dest: (index: number) => Coord;
}

function getLines(direction: Direction): LineDef[] {
  const lines: LineDef[] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (direction === "left") {
      lines.push({
        coords: [
          [i, 0],
          [i, 1],
          [i, 2],
          [i, 3],
        ],
        dest: (index) => [i, index],
      });
    } else if (direction === "right") {
      lines.push({
        coords: [
          [i, 3],
          [i, 2],
          [i, 1],
          [i, 0],
        ],
        dest: (index) => [i, BOARD_SIZE - 1 - index],
      });
    } else if (direction === "up") {
      lines.push({
        coords: [
          [0, i],
          [1, i],
          [2, i],
          [3, i],
        ],
        dest: (index) => [index, i],
      });
    } else {
      lines.push({
        coords: [
          [3, i],
          [2, i],
          [1, i],
          [0, i],
        ],
        dest: (index) => [BOARD_SIZE - 1 - index, i],
      });
    }
  }

  return lines;
}

export class GameEngine {
  tiles: Tile[] = [];
  score = 0;
  gameOver = false;

  private rngState: RngState;
  private nextId = 1;

  constructor(seed: number) {
    this.rngState = createRng(seed);
    // Dos fichas iniciales, igual que el 2048 clasico.
    this.spawn();
    this.spawn();
  }

  // Devuelve una copia de las fichas actuales.
  getTiles(): Tile[] {
    return this.tiles.map((t) => ({ ...t }));
  }

  getSnapshot(): GameSnapshot {
    return { tiles: this.getTiles(), score: this.score };
  }

  // Serializa el estado completo para poder guardarlo.
  serialize(): SavedGame {
    return {
      rngState: { s: this.rngState.s },
      nextId: this.nextId,
      tiles: this.getTiles(),
      score: this.score,
      gameOver: this.gameOver,
    };
  }

  // Reconstruye un motor desde un estado guardado (sin generar fichas nuevas).
  static fromSaved(saved: SavedGame): GameEngine {
    const engine = Object.create(GameEngine.prototype) as GameEngine;
    engine.rngState = { s: saved.rngState.s };
    engine.nextId = saved.nextId;
    engine.tiles = saved.tiles.map((t) => ({ ...t }));
    engine.score = saved.score;
    engine.gameOver = saved.gameOver;
    return engine;
  }

  // Celdas vacias del tablero.
  private emptyCells(): Coord[] {
    const occupied = new Set(this.tiles.map((t) => `${t.row},${t.col}`));
    const empty: Coord[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!occupied.has(`${row},${col}`)) empty.push([row, col]);
      }
    }
    return empty;
  }

  // Genera una ficha (90% -> 2, 10% -> 4) en una celda vacia aleatoria.
  private spawn(): void {
    const empty = this.emptyCells();
    if (empty.length === 0) return;

    const cell = rngInt(this.rngState, empty.length);
    this.rngState = cell.next;

    const roll = rngNext(this.rngState);
    this.rngState = roll.next;

    const [row, col] = empty[cell.value];
    this.tiles.push({
      id: this.nextId++,
      value: roll.value < 0.9 ? 2 : 4,
      row,
      col,
      isNew: true,
    });
  }

  // Aplica un movimiento. Devuelve los datos necesarios para animar.
  move(direction: Direction): MoveResult {
    if (this.gameOver) {
      return {
        moved: false,
        slideTiles: this.getTiles(),
        finalTiles: this.getTiles(),
        scoreGained: 0,
      };
    }

    const grid: (Tile | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
      Array<Tile | null>(BOARD_SIZE).fill(null)
    );
    for (const tile of this.tiles) {
      grid[tile.row][tile.col] = tile;
    }

    const slideTiles: Tile[] = [];
    const mergedTiles: Tile[] = [];
    let scoreGained = 0;

    // Posiciones originales, para saber que fichas se mueven realmente.
    const originalById = new Map(this.tiles.map((t) => [t.id, t]));

    for (const line of getLines(direction)) {
      // Fichas de la linea en orden near -> far.
      const lineTiles = line.coords
        .map(([r, c]) => grid[r][c])
        .filter((t): t is Tile => t !== null);

      // Comprime y fusiona pares iguales una sola vez respetando el orden.
      const slots: { value: number; tiles: Tile[]; merged: boolean }[] = [];
      for (const tile of lineTiles) {
        const last = slots[slots.length - 1];
        if (last && last.value === tile.value && !last.merged) {
          last.value *= 2;
          last.tiles.push(tile);
          last.merged = true;
          scoreGained += last.value;
        } else {
          slots.push({ value: tile.value, tiles: [tile], merged: false });
        }
      }

      slots.forEach((slot, index) => {
        const [dr, dc] = line.dest(index);

        // Fase de deslizamiento: todas las fichas originales van a la celda destino.
        // Marcamos "moving" solo si realmente cambian de posicion.
        for (const tile of slot.tiles) {
          const original = originalById.get(tile.id);
          const moving =
            !original || original.row !== dr || original.col !== dc;
          slideTiles.push({
            ...tile,
            row: dr,
            col: dc,
            isNew: false,
            merged: false,
            moving,
          });
        }

        if (slot.tiles.length === 2) {
          // Fusion: conservamos el id de la ficha que MAS se movio (la mas
          // alejada del borde), para que el elemento que el usuario ve
          // deslizarse sea el mismo que termina fusionandose. La ficha mas
          // cercana al borde (que apenas se movio) se elimina.
          const survivor = slot.tiles[1];
          mergedTiles.push({
            ...survivor,
            value: slot.value,
            row: dr,
            col: dc,
            isNew: false,
            merged: true,
            moving: false,
          });
        } else {
          const tile = slot.tiles[0];
          const original = originalById.get(tile.id);
          const moving =
            !original || original.row !== dr || original.col !== dc;
          mergedTiles.push({
            ...tile,
            value: slot.value,
            row: dr,
            col: dc,
            isNew: false,
            merged: false,
            moving,
          });
        }
      });
    }

    // El movimiento es valido si alguna ficha cambio de posicion.
    const moved = slideTiles.some((t) => {
      const original = originalById.get(t.id);
      return !original || original.row !== t.row || original.col !== t.col;
    });

    if (!moved) {
      return {
        moved: false,
        slideTiles: this.getTiles(),
        finalTiles: this.getTiles(),
        scoreGained: 0,
      };
    }

    // Aplica el resultado y genera la nueva ficha.
    this.tiles = mergedTiles;
    this.score += scoreGained;
    this.spawn();
    this.gameOver = this.checkGameOver();

    return {
      moved: true,
      slideTiles,
      finalTiles: this.getTiles(),
      scoreGained,
    };
  }

  // Hay game over si no quedan celdas vacias ni fusiones posibles.
  private checkGameOver(): boolean {
    if (this.tiles.length < BOARD_SIZE * BOARD_SIZE) return false;

    const grid = new Map<string, number>();
    for (const t of this.tiles) grid.set(`${t.row},${t.col}`, t.value);

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const value = grid.get(`${row},${col}`);
        if (value === undefined) return false;
        const right = grid.get(`${row},${col + 1}`);
        const down = grid.get(`${row + 1},${col}`);
        if (right !== undefined && right === value) return false;
        if (down !== undefined && down === value) return false;
      }
    }
    return true;
  }
}

// Utilidad para reasignar ids al recibir el tablero del rival.
export function rekeyTiles(tiles: Tile[]): Tile[] {
  let id = -1;
  return tiles.map((t) => ({
    id: id--,
    value: t.value,
    row: t.row,
    col: t.col,
  }));
}
