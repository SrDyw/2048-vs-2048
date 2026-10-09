"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  $busy,
  $myTiles,
  $opponentTiles,
  $rematchPending,
  $rematchRejected,
  $rematchRequested,
} from "@/stores/gameStore";
import { cn } from "@/lib/cn";
import { CrownIcon, ExitIcon, RefreshIcon, SpinnerIcon } from "./icons";
import { Board } from "./Board";

interface ResultScreenProps {
  myScore: number;
  opponentScore: number;
  onRequestRematch: () => void;
  onAcceptRematch: () => void;
  onRejectRematch: () => void;
  onLeave: () => void;
}

// Pantalla final comparativa con confeti y gestion de revancha.
export function ResultScreen({
  myScore,
  opponentScore,
  onRequestRematch,
  onAcceptRematch,
  onRejectRematch,
  onLeave,
}: ResultScreenProps) {
  const rematchRequested = useStore($rematchRequested);
  const rematchRejected = useStore($rematchRejected);
  const rematchPending = useStore($rematchPending);
  const busy = useStore($busy);
  const myTiles = useStore($myTiles);
  const opponentTiles = useStore($opponentTiles);

  const draw = myScore === opponentScore;
  const iWon = myScore > opponentScore;
  const title = draw ? "Empate" : iWon ? "¡Ganaste!" : "Perdiste";

  // Lluvia de confeti durante ~4 segundos al mostrar el resultado.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const end = Date.now() + 4000;
      const colors = ["#a89bd9", "#f2a8b8", "#f5d76e", "#8ad9c7", "#9bb8e8"];

      interval = setInterval(() => {
        if (Date.now() > end) {
          if (interval) clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 6,
          spread: 70,
          startVelocity: 40,
          origin: { x: Math.random(), y: Math.random() * 0.4 },
          colors,
        });
      }, 200);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="fade-in w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eee6d8]">
        <h2
          className={cn(
            "text-center text-3xl font-bold mb-6",
            draw
              ? "text-[var(--color-texto)]"
              : iWon
                ? "text-[var(--color-exito)]"
                : "text-[var(--color-acento-2)]"
          )}
        >
          {title}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <ScoreCard
            label="Tu"
            score={myScore}
            highlight={!draw && iWon}
          />
          <ScoreCard
            label="Rival"
            score={opponentScore}
            highlight={!draw && !iWon}
          />
        </div>

        {/* Tableros finales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="mb-2 text-center text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
              Tu tablero
            </p>
            <Board tiles={myTiles} compact />
          </div>
          <div>
            <p className="mb-2 text-center text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
              Tablero del rival
            </p>
            <Board tiles={opponentTiles} compact />
          </div>
        </div>

        {rematchRejected ? (
          <div className="text-center">
            <p className="text-[var(--color-texto-2)]">
              El rival no quiere revancha
            </p>
            <button
              type="button"
              onClick={onLeave}
              className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--color-acento)] text-white font-semibold"
            >
              <ExitIcon className="w-5 h-5" />
              Salir al inicio
            </button>
          </div>
        ) : rematchRequested ? (
          <div className="text-center">
            <p className="mb-3 text-[var(--color-texto)] font-semibold">
              Tu rival quiere la revancha
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onAcceptRematch}
                disabled={busy}
                className="flex-1 py-3 rounded-2xl bg-[var(--color-exito)] text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {busy ? <SpinnerIcon className="w-5 h-5" /> : null}
                Aceptar revancha
              </button>
              <button
                type="button"
                onClick={onRejectRematch}
                disabled={busy}
                className="flex-1 py-3 rounded-2xl bg-white text-[var(--color-texto)] border border-[var(--color-celda)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Rechazar
              </button>
            </div>
          </div>
        ) : rematchPending ? (
          <div className="text-center py-2">
            <p className="inline-flex items-center gap-2 text-[var(--color-texto-2)]">
              <SpinnerIcon className="w-5 h-5" />
              Esperando confirmacion del rival...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onRequestRematch}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--color-acento)] text-white font-semibold shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshIcon className="w-5 h-5" />
              Volver a jugar
            </button>
            <button
              type="button"
              onClick={onLeave}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[var(--color-texto-2)] hover:text-[var(--color-error)] transition-colors disabled:opacity-60"
            >
              <ExitIcon className="w-4 h-4" />
              Salir al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Tarjeta de puntuacion con corona para el ganador.
function ScoreCard({
  label,
  score,
  highlight,
}: {
  label: string;
  score: number;
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-4 text-center border transition-all",
        highlight
          ? "bg-[var(--color-tile-2048)]/25 border-[var(--color-tile-2048)]"
          : "bg-white border-[var(--color-celda)]"
      )}
    >
      {highlight && (
        <CrownIcon className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 text-[var(--color-tile-2048)] fill-[var(--color-tile-2048)]/30" />
      )}
      <p className="text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
        {label}
      </p>
      <p className="text-3xl font-bold text-[var(--color-texto)]">{score}</p>
    </div>
  );
}
