"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $history } from "@/stores/gameStore";
import type { GameMode } from "@/lib/history";
import { cn } from "@/lib/cn";
import { CrownIcon, TrophyIcon } from "./icons";

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
}

// Formatea la fecha de una partida.
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formatea una duracion en milisegundos como m:ss.
function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Modal con el historial de partidas, con pestanas Solo / VS.
export function HistoryModal({ open, onClose }: HistoryModalProps) {
  const [tab, setTab] = useState<GameMode>("solo");
  const history = useStore($history);

  if (!open) return null;

  const entries = history.filter((entry) => entry.mode === tab);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-texto)]/30 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="fade-in w-full max-w-md rounded-3xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-6 border border-[#eee6d8]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--color-texto)]">
            Historial de partidas
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[var(--color-texto-2)] hover:text-[var(--color-texto)] text-2xl leading-none px-1"
          >
            ×
          </button>
        </div>

        {/* Pestanas */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--color-tablero)] p-1">
          {(["solo", "vs"] as GameMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTab(mode)}
              className={cn(
                "py-2 rounded-xl text-sm font-semibold transition-colors",
                tab === mode
                  ? "bg-white text-[var(--color-texto)] shadow-[var(--shadow-suave)]"
                  : "text-[var(--color-texto-2)]"
              )}
            >
              {mode === "solo" ? "Solo" : "VS"}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="max-h-[50vh] overflow-y-auto -mr-2 pr-2 space-y-2">
          {entries.length === 0 && (
            <p className="text-center text-sm text-[var(--color-texto-2)] py-8">
              Todavia no hay partidas {tab === "solo" ? "en solitario" : "VS"}.
            </p>
          )}

          {entries.map((entry) => {
            const resultLabel =
              entry.result === "win"
                ? "Ganaste"
                : entry.result === "lose"
                  ? "Perdiste"
                  : entry.result === "draw"
                    ? "Empate"
                    : "Partida";

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl border border-[#eee6d8] px-4 py-3"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                    entry.result === "win"
                      ? "bg-[var(--color-tile-2048)]/25 text-[var(--color-tile-2048)]"
                      : entry.mode === "solo"
                        ? "bg-[var(--color-acento)]/12 text-[var(--color-acento)]"
                        : "bg-[var(--color-celda)]/50 text-[var(--color-texto-2)]"
                  )}
                >
                  {entry.result === "win" ? (
                    <CrownIcon className="w-5 h-5" />
                  ) : (
                    <TrophyIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-texto)]">
                    {entry.score} puntos
                  </p>
                  <p className="text-xs text-[var(--color-texto-2)]">
                    {entry.mode === "vs"
                      ? `${resultLabel} · Rival ${entry.opponentScore ?? 0} · `
                      : ""}
                    {formatDate(entry.date)} · {formatDuration(entry.durationMs)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
