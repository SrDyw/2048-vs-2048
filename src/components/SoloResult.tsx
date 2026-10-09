"use client";

import { useEffect } from "react";
import { ExitIcon, RefreshIcon, TrophyIcon } from "./icons";

interface SoloResultProps {
  score: number;
  onReplay: () => void;
  onExit: () => void;
}

// Resultado del modo un jugador.
export function SoloResult({ score, onReplay, onExit }: SoloResultProps) {
  // Un pequeno estallido de confeti al terminar.
  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.35 },
        colors: ["#a89bd9", "#f2a8b8", "#f5d76e", "#8ad9c7", "#9bb8e8"],
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fade-in w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 border border-[#eee6d8] text-center">
        <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-tile-2048)]/25 text-[var(--color-tile-2048)]">
          <TrophyIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-texto)]">
          Partida terminada
        </h2>
        <p className="mt-4 text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
          Tu puntuacion
        </p>
        <p className="text-5xl font-extrabold text-[var(--color-acento)]">
          {score}
        </p>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={onReplay}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--color-acento)] text-white font-semibold shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshIcon className="w-5 h-5" />
            Jugar de nuevo
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[var(--color-texto-2)] hover:text-[var(--color-error)] transition-colors"
          >
            <ExitIcon className="w-4 h-4" />
            Salir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
