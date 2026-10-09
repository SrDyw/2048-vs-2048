// Colores de las fichas, replicados para poder dibujarlas en un canvas
// (el canvas no puede leer las clases CSS). Deben coincidir con globals.css.

export interface TileColors {
  bg: string;
  fg: string;
}

const MAP: Record<number, TileColors> = {
  2: { bg: "#f6e3c8", fg: "#6b5b4a" },
  4: { bg: "#f4d096", fg: "#6b5b4a" },
  8: { bg: "#f3ba6c", fg: "#ffffff" },
  16: { bg: "#ef9a5f", fg: "#ffffff" },
  32: { bg: "#e96f6f", fg: "#ffffff" },
  64: { bg: "#d85a8c", fg: "#ffffff" },
  128: { bg: "#a97fe0", fg: "#ffffff" },
  256: { bg: "#6e9be8", fg: "#ffffff" },
  512: { bg: "#4fcbb0", fg: "#ffffff" },
  1024: { bg: "#7fc95a", fg: "#ffffff" },
  2048: { bg: "#f0c530", fg: "#ffffff" },
};

// Colores base del tablero y la celda vacia.
export const BOARD_BG = "#ded4c6";
export const CELL_BG = "#cec2b1";
export const PAGE_BG = "#faf6ee";
export const TEXT_COLOR = "#3d342c";
export const TEXT_MUTED = "#857567";
export const ACCENT = "#9b87e0";
export const ACCENT_2 = "#ef85a2";

// Devuelve los colores de una ficha segun su valor.
export function tileColors(value: number): TileColors {
  return MAP[value] ?? { bg: "#a97fe0", fg: "#ffffff" };
}

// Indica si el valor usa el degradado de fichas altas (4096+).
export function isHighValue(value: number): boolean {
  return value > 2048;
}
