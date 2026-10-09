"use client";

import { RefreshIcon, TrophyIcon } from "./icons";

interface SoloStartDialogProps {
  open: boolean;
  onContinue: () => void;
  onNew: () => void;
  onCancel: () => void;
}

// Dialogo que aparece al pulsar "Jugar solo" si hay una partida guardada.
export function SoloStartDialog({
  open,
  onContinue,
  onNew,
  onCancel,
}: SoloStartDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-texto)]/30 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="fade-in w-full max-w-sm rounded-3xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-6 text-center border border-[#eee6d8]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-acento)]/12 text-[var(--color-acento)]">
          <TrophyIcon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-texto)]">
          Tienes una partida guardada
        </h3>
        <p className="mt-2 text-sm text-[var(--color-texto-2)]">
          Puedes continuarla donde la dejaste o empezar de cero.
        </p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-acento)] text-white font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Continuar partida
          </button>
          <button
            type="button"
            onClick={onNew}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-[var(--color-texto)] border border-[var(--color-celda)] font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <RefreshIcon className="w-5 h-5" />
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  );
}
