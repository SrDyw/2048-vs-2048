"use client";

import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  $busy,
  $isHost,
  $myId,
  $opponentStatus,
  $players,
  $roomCode,
} from "@/stores/gameStore";
import { cn } from "@/lib/cn";
import { CheckIcon, CopyIcon, ExitIcon, SpinnerIcon, UserIcon } from "./icons";

interface LobbyProps {
  onToggleReady: () => void;
  onStart: () => void;
  onLeave: () => void;
}

// Campo de jugador (yo o el rival).
function PlayerSlot({
  name,
  ready,
  isMe,
  empty,
}: {
  name: string;
  ready: boolean;
  isMe: boolean;
  empty: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-2xl p-4 sm:p-5 text-center border transition-colors",
        empty
          ? "border-dashed border-[var(--color-celda)] bg-white/40"
          : "border-transparent bg-white shadow-[var(--shadow-suave)]"
      )}
    >
      <div
        className={cn(
          "mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-full",
          empty
            ? "bg-[var(--color-celda)]/60 text-[var(--color-texto-2)]"
            : "bg-[var(--color-acento)]/15 text-[var(--color-acento)]"
        )}
      >
        <UserIcon className="w-7 h-7" />
      </div>
      <p className="font-semibold text-[var(--color-texto)] truncate">
        {name}
      </p>
      <p className="text-xs text-[var(--color-texto-2)] mb-2">
        {isMe ? "Tu" : "Rival"}
      </p>
      {!empty && ready && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-exito)]">
          <CheckIcon className="w-4 h-4" />
          Listo
        </span>
      )}
      {empty && (
        <span className="text-xs text-[var(--color-texto-2)] pulse-soft">
          Esperando...
        </span>
      )}
    </div>
  );
}

// Sala de espera con codigo, slots y controles.
export function Lobby({ onToggleReady, onStart, onLeave }: LobbyProps) {
  const code = useStore($roomCode);
  const players = useStore($players);
  const myId = useStore($myId);
  const isHost = useStore($isHost);
  const opponentStatus = useStore($opponentStatus);
  const busy = useStore($busy);
  const [copied, setCopied] = useState(false);

  const me = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const bothReady =
    players.length === 2 && players.every((p) => p.ready);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Si el navegador bloquea el portapapeles, no hacemos nada.
    }
  };

  if (opponentStatus === "left") {
    return (
      <div className="fade-in w-full max-w-md mx-auto text-center bg-white/70 rounded-3xl shadow-[var(--shadow-suave)] p-8 border border-white">
        <p className="text-lg font-semibold text-[var(--color-texto)]">
          El rival se desconecto
        </p>
        <p className="mt-2 text-sm text-[var(--color-texto-2)]">
          La sala se ha quedado sin rival.
        </p>
        <button
          type="button"
          onClick={onLeave}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--color-acento)] text-white font-semibold"
        >
          <ExitIcon className="w-5 h-5" />
          Salir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eee6d8]">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
            Codigo de sala
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-3xl sm:text-4xl font-bold tracking-[0.3em] text-[var(--color-texto)]">
              {code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copiar codigo"
              className="p-2 rounded-xl bg-[var(--color-acento)]/12 text-[var(--color-acento)] hover:bg-[var(--color-acento)]/20 transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <CopyIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-1 text-xs text-[var(--color-exito)]">Copiado</p>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <PlayerSlot
            name={me?.name ?? "Tu"}
            ready={!!me?.ready}
            isMe
            empty={false}
          />
          <PlayerSlot
            name={opponent?.name ?? "Rival"}
            ready={!!opponent?.ready}
            isMe={false}
            empty={!opponent}
          />
        </div>

        <button
          type="button"
          onClick={onToggleReady}
          disabled={busy}
          className={cn(
            "w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-suave)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed",
            me?.ready
              ? "bg-[var(--color-exito)] text-white"
              : "bg-white text-[var(--color-texto)] border border-[var(--color-celda)]"
          )}
        >
          {me?.ready ? (
            <>
              <CheckIcon className="w-5 h-5" />
              Listo
            </>
          ) : (
            "Estoy listo"
          )}
        </button>

        {isHost && (
          <button
            type="button"
            onClick={onStart}
            disabled={!bothReady || busy}
            className="mt-3 w-full py-3.5 rounded-2xl font-semibold bg-[var(--color-acento)] text-white shadow-[var(--shadow-suave)] disabled:opacity-40 disabled:cursor-not-allowed transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            {busy ? <SpinnerIcon className="w-5 h-5" /> : null}
            Empezar
          </button>
        )}

        {!isHost && (
          <p className="mt-3 text-center text-sm text-[var(--color-texto-2)]">
            {bothReady
              ? "Esperando a que el anfitrion empiece..."
              : "El anfitrion podra empezar cuando ambos esteis listos"}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onLeave}
        className="mt-4 mx-auto flex items-center gap-2 text-sm text-[var(--color-texto-2)] hover:text-[var(--color-error)] transition-colors"
      >
        <ExitIcon className="w-4 h-4" />
        Salir
      </button>
    </div>
  );
}
