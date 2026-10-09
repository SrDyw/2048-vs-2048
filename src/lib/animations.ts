// Duraciones e utilidades de animacion.

export const SLIDE_MS = 200;
export const MERGE_MS = 100;
export const OPPONENT_SLIDE_MS = 130;

// Respeta la preferencia del usuario de movimiento reducido.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Devuelve la duracion del deslizamiento segun la preferencia del usuario.
export function slideDuration(compact = false): number {
  if (prefersReducedMotion()) return 0;
  return compact ? OPPONENT_SLIDE_MS : SLIDE_MS;
}
