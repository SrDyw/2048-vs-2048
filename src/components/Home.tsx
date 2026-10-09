"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $bestSolo, $bestVs, $busy, $error, $playerName } from "@/stores/gameStore";
import { CheckIcon, GithubIcon, HistoryIcon, SpinnerIcon, TrophyIcon, UserIcon } from "./icons";
import { Logo } from "./Logo";
import { HistoryModal } from "./HistoryModal";

interface HomeProps {
  onCreate: () => void;
  onJoin: (code: string) => void;
  onSolo: () => void;
}

// Pantalla inicial: crear sala, unirse con codigo o jugar solo.
export function Home({ onCreate, onJoin, onSolo }: HomeProps) {
  const [code, setCode] = useState("");
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
    <div className="fade-in w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Logo />
        <p className="mt-3 text-[var(--color-texto-2)]">
          Compite en tiempo real contra un rival
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eee6d8]">
        {/* Nombre del jugador */}
        <label className="block text-sm font-semibold text-[var(--color-texto-2)] mb-2">
          Tu nombre
        </label>
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-acento)]">
            <UserIcon className="w-5 h-5" />
          </div>
          <input
            value={name}
            onChange={(e) => $playerName.set(e.target.value)}
            maxLength={16}
            placeholder="Escribe tu nombre"
            aria-label="Tu nombre"
            disabled={busy}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[var(--color-celda)] outline-none font-semibold text-[var(--color-texto)] focus:border-[var(--color-acento)] transition-colors disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={onCreate}
          disabled={busy}
          className="w-full py-4 rounded-2xl bg-[var(--color-acento)] text-white font-semibold text-lg shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {busy ? <SpinnerIcon className="w-5 h-5" /> : null}
          Crear sala
        </button>

        <button
          type="button"
          onClick={onSolo}
          disabled={busy}
          className="mt-3 w-full py-3 rounded-2xl bg-white text-[var(--color-texto)] border border-[var(--color-celda)] font-semibold inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <UserIcon className="w-5 h-5 text-[var(--color-acento)]" />
          Jugar solo
        </button>

        <div className="flex items-center gap-3 my-6">
          <span className="h-px flex-1 bg-[var(--color-celda)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
            o
          </span>
          <span className="h-px flex-1 bg-[var(--color-celda)]" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--color-texto-2)]">
            Unirse a sala
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="CODIGO"
              aria-label="Codigo de sala"
              disabled={busy}
              className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white border border-[var(--color-celda)] outline-none tracking-[0.3em] text-center font-semibold text-[var(--color-texto)] focus:border-[var(--color-acento)] transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-3 rounded-2xl bg-[var(--color-acento-2)] text-white font-semibold shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[92px]"
            >
              {busy ? <SpinnerIcon className="w-5 h-5" /> : "Entrar"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-[var(--color-error)] flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
              {error}
            </p>
          )}
        </form>
      </div>

      {/* Mejores puntuaciones */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-[#eee6d8] px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--color-texto-2)] inline-flex items-center gap-1">
            <TrophyIcon className="w-3.5 h-3.5 text-[var(--color-acento)]" />
            Mejor solo
          </p>
          <p className="text-2xl font-extrabold text-[var(--color-acento)]">
            {bestSolo}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-[#eee6d8] px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--color-texto-2)] inline-flex items-center gap-1">
            <TrophyIcon className="w-3.5 h-3.5 text-[var(--color-acento-2)]" />
            Mejor VS
          </p>
          <p className="text-2xl font-extrabold text-[var(--color-acento-2)]">
            {bestVs}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="mt-3 w-full py-3 rounded-2xl bg-white text-[var(--color-texto)] border border-[var(--color-celda)] font-semibold inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <HistoryIcon className="w-5 h-5 text-[var(--color-acento)]" />
        Historial de partidas
      </button>

      <ul className="mt-8 space-y-2 text-sm text-[var(--color-texto-2)]">
        {[
          "Mismo tablero y mismas fichas para ambos",
          "Flechas del teclado, gestos o botones",
          "Gana quien consiga mas puntos",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-[var(--color-exito)]" />
            {item}
          </li>
        ))}
      </ul>

      <a
        href="https://github.com/SrDyw/2048-vs-2048"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--color-texto-2)] hover:text-[var(--color-texto)] transition-colors"
      >
        <GithubIcon className="w-4 h-4" />
        Ver el proyecto en GitHub
      </a>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
