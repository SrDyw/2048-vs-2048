"use client";

import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { $myTiles, $newRecord } from "@/stores/gameStore";
import { shareResult } from "@/lib/share";
import { ExitIcon, RefreshIcon, ShareIcon, SpinnerIcon, TrophyIcon } from "./icons";
import { Board } from "./Board";

interface SoloResultProps {
  score: number;
  onReplay: () => void;
  onExit: () => void;
}

// Resultado del modo un jugador.
export function SoloResult({ score, onReplay, onExit }: SoloResultProps) {
  const myTiles = useStore($myTiles);
  const newRecord = useStore($newRecord);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareResult({
        headline: "Partida terminada",
        myScore: score,
        myTiles,
        solo: true,
      });
    } catch {
      // Si falla, no interrumpimos el resultado.
    } finally {
      setSharing(false);
    }
  };

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

        {newRecord && (
          <p className="mx-auto mt-3 w-fit inline-flex items-center gap-1.5 rounded-full bg-[var(--color-tile-2048)]/25 px-3 py-1 text-sm font-semibold text-[var(--color-texto)]">
            <TrophyIcon className="w-4 h-4 text-[var(--color-tile-2048)]" />
            ¡Nuevo record!
          </p>
        )}
        <p className="mt-4 text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
          Tu puntuacion
        </p>
        <p className="text-5xl font-extrabold text-[var(--color-acento)]">
          {score}
        </p>

        {/* Tablero final */}
        <div className="mx-auto mt-6 max-w-[240px]">
          <Board tiles={myTiles} compact />
        </div>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--color-exito)] text-white font-semibold shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sharing ? <SpinnerIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
            Compartir
          </button>
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
