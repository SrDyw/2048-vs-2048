"use client";

import { ExitIcon } from "./icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Modal de confirmacion reutilizable.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Salir",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
          <ExitIcon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-texto)]">{title}</h3>
        {message && (
          <p className="mt-2 text-sm text-[var(--color-texto-2)]">{message}</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-white text-[var(--color-texto)] border border-[var(--color-celda)] font-semibold transition-transform active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-[var(--color-acento)] text-white font-semibold transition-transform active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
