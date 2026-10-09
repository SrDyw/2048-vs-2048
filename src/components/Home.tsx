"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $bestSolo, $bestVs, $busy, $error, $playerName } from "@/stores/gameStore";
import { cn } from "@/lib/cn";
import { GithubIcon, HistoryIcon, SpinnerIcon, TrophyIcon, UserIcon } from "./icons";
import { Logo } from "./Logo";
import { HistoryModal } from "./HistoryModal";

interface HomeProps {
  onCreate: () => void;
  onJoin: (code: string) => void;
  onSolo: () => void;
}

// Pantalla inicial: minimalista, con una accion principal y el resto agrupado.
export function Home({ onCreate, onJoin, onSolo }: HomeProps) {
  const [code, setCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const error = useStore($error);
  const busy = useStore($busy);
  const name = useStore($playerName);
  const bestSolo = useStore($bestSolo);
  const bestVs = useStore($bestVs);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onJoin(code);
  };

  return (
    <div className="fade-in w-full max-w-sm mx-auto">
      {/* Titulo */}
      <div className="text-center mb-8">
        <Logo />
        <p className="mt-3 text-sm text-[var(--color-texto-2)]">
          Compite en tiempo real contra un rival
        </p>
      </div>

      {/* Nombre (discreto) */}
      <div className="relative mb-3">
        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-texto-2)]" />
        <input
          value={name}
          onChange={(e) => $playerName.set(e.target.value)}
          maxLength={16}
          placeholder="Tu nombre"
          aria-label="Tu nombre"
          disabled={busy}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#eee6d8] text-sm font-medium text-[var(--color-texto)] outline-none focus:border-[var(--color-acento)] transition-colors disabled:opacity-60"
        />
      </div>

      {/* Accion principal */}
      <button
        type="button"
        onClick={onCreate}
        disabled={busy}
        className="w-full py-3.5 rounded-2xl bg-[var(--color-acento)] text-white font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? <SpinnerIcon className="w-5 h-5" /> : null}
        Crear sala
      </button>

      {/* Acciones secundarias */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSolo}
          disabled={busy}
          className="py-3 rounded-2xl bg-white border border-[#eee6d8] text-sm font-semibold text-[var(--color-texto)] transition-colors hover:border-[var(--color-acento)] disabled:opacity-60"
        >
          Jugar solo
        </button>
        <button
          type="button"
          onClick={() => setShowJoin((value) => !value)}
          disabled={busy}
          aria-expanded={showJoin}
          className={cn(
            "py-3 rounded-2xl text-sm font-semibold border transition-colors disabled:opacity-60",
            showJoin
              ? "bg-[var(--color-acento-2)] text-white border-transparent"
              : "bg-white text-[var(--color-texto)] border-[#eee6d8] hover:border-[var(--color-acento-2)]"
          )}
        >
          Unirse a sala
        </button>
      </div>

      {/* Campo para unirse (solo cuando se necesita) */}
      {showJoin && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
            placeholder="CODIGO"
            aria-label="Codigo de sala"
            disabled={busy}
            className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white border border-[#eee6d8] outline-none tracking-[0.3em] text-center font-semibold text-[var(--color-texto)] focus:border-[var(--color-acento-2)] transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-3 rounded-2xl bg-[var(--color-acento-2)] text-white font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 min-w-[80px] inline-flex items-center justify-center"
          >
            {busy ? <SpinnerIcon className="w-5 h-5" /> : "Entrar"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-sm text-[var(--color-error)] text-center">
          {error}
        </p>
      )}

      {/* Pie: mejores puntuaciones + enlaces (sin ruido visual) */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[var(--color-texto-2)]">
        <span className="inline-flex items-center gap-1.5">
          <TrophyIcon className="w-3.5 h-3.5 text-[var(--color-acento)]" />
          Solo
          <b className="text-[var(--color-texto)]">{bestSolo}</b>
        </span>
        <span className="h-3 w-px bg-[var(--color-celda)]" />
        <span className="inline-flex items-center gap-1.5">
          <TrophyIcon className="w-3.5 h-3.5 text-[var(--color-acento-2)]" />
          VS
          <b className="text-[var(--color-texto)]">{bestVs}</b>
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-5 text-xs">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="inline-flex items-center gap-1.5 text-[var(--color-texto-2)] hover:text-[var(--color-texto)] transition-colors"
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          Historial
        </button>
        <a
          href="https://github.com/SrDyw/2048-vs-2048"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[var(--color-texto-2)] hover:text-[var(--color-texto)] transition-colors"
        >
          <GithubIcon className="w-3.5 h-3.5" />
          GitHub
        </a>
      </div>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
