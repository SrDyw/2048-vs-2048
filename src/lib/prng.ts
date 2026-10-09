// PRNG determinista basado en mulberry32.
// Se usa una seed compartida entre jugadores para que el orden de
// aparicion de fichas sea identico en ambos clientes.

export interface RngState {
  s: number;
}

// Crea el estado inicial a partir de una semilla entera.
export function createRng(seed: number): RngState {
  // >>> 0 fuerza un entero sin signo de 32 bits.
  return { s: seed >>> 0 };
}

// Avanza el generador y devuelve un flotante en [0, 1) junto al nuevo estado.
// Es puro: no muta el estado recibido.
export function rngNext(state: RngState): { value: number; next: RngState } {
  let t = (state.s + 0x6d2b79f5) >>> 0;
  let r = t;
  r = Math.imul(r ^ (r >>> 15), r | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return { value, next: { s: t } };
}

// Devuelve un entero en [0, max) usando el generador.
export function rngInt(
  state: RngState,
  max: number
): { value: number; next: RngState } {
  const { value, next } = rngNext(state);
  return { value: Math.floor(value * max), next };
}

// Genera una semilla aleatoria (solo se usa en el servidor).
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
