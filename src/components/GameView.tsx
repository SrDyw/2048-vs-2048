"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { GameEngine, type Direction, type GameSnapshot, type SavedGame } from "@/lib/game2048";
import { MERGE_MS, prefersReducedMotion, slideDuration } from "@/lib/animations";
import { clearSoloGame, saveSoloGame } from "@/lib/soloSave";
import {
  $myOver,
  $myScore,
  $myTiles,
  $opponentOver,
  $opponentScore,
  $opponentStatus,
  $opponentTiles,
  $sessionStart,
} from "@/stores/gameStore";
import { cn } from "@/lib/cn";
import { Board } from "./Board";
import { ConfirmDialog } from "./ConfirmDialog";
import { ClockIcon, FlagIcon } from "./icons";

interface GameViewProps {
  seed: number;
  onSendMove: (snapshot: GameSnapshot) => void;
  onGameOver: (score: number) => void;
  // Modo un jugador: sin tablero rival ni envio de eventos.
  solo?: boolean;
  // Partida guardada que se esta continuando (solo en modo un jugador).
  saved?: SavedGame | null;
}

// Formatea segundos como m:ss.
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Vista de partida: tablero propio grande + tablero del rival pequeno.
export function GameView({  seed,
  onSendMove,
  onGameOver,
  solo = false,
  saved = null,
}: GameViewProps) {
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = saved ? GameEngine.fromSaved(saved) : new GameEngine(seed);
  }
  const engine = engineRef.current;

  const [tiles, setTiles] = useState(() => engine.getTiles());
  const [score, setScore] = useState(engine.score);
  const [over, setOver] = useState(false);
  const [showForceEnd, setShowForceEnd] = useState(false);

  const lockedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  // Ref sincronizada con el modal de finalizar para bloquear movimientos.
  const forceEndRef = useRef(false);

  const opponentTiles = useStore($opponentTiles);
  const opponentScore = useStore($opponentScore);
  const opponentOver = useStore($opponentOver);
  const opponentStatus = useStore($opponentStatus);
  const myOverStore = useStore($myOver);
  const sessionStart = useStore($sessionStart);
  const [elapsed, setElapsed] = useState(0);

  // En solo nunca se muestra el modo espectador.
  const spectator = solo ? false : over || myOverStore;

  const doMove = useCallback(
    (direction: Direction) => {
      if (lockedRef.current || spectator || forceEndRef.current) return;

      const result = engine.move(direction);
      if (!result.moved) return;

      lockedRef.current = true;
      // Fase 1: deslizamiento. Un pequeno buffer asegura que la transicion
      // haya terminado antes de aplicar la fusion y su "pop".
      setTiles(result.slideTiles);
      const reduce = prefersReducedMotion();
      const phase1Delay = slideDuration() + (reduce ? 0 : 50);

      window.setTimeout(() => {
        // Fase 2: fusiones + nueva ficha.
        setTiles(result.finalTiles);
        setScore(engine.score);
        $myScore.set(engine.score);
        // Mantiene el tablero actual disponible (para compartir en cualquier momento).
        $myTiles.set(result.finalTiles);
        if (!solo) {
          onSendMove({ tiles: result.finalTiles, score: engine.score });
        }

        if (engine.gameOver) {
          setOver(true);
          $myOver.set(true);
          // Guardamos el tablero final para mostrarlo en el resultado.
          $myTiles.set(result.finalTiles);
          onGameOver(engine.score);
        }

        // En modo un jugador, guardamos el estado para poder continuar luego.
        if (solo) {
          if (engine.gameOver) {
            clearSoloGame();
          } else {
            saveSoloGame(engine.serialize());
          }
        }

        const unlock = reduce ? 0 : MERGE_MS;
        window.setTimeout(() => {
          lockedRef.current = false;
        }, unlock);
      }, phase1Delay);
    },
    [engine, onSendMove, onGameOver, spectator, solo]
  );

  // Finaliza la partida forzadamente (tecla Escape). Aplica el mismo resultado
  // que una derrota normal: congela el tablero, envia el game over y muestra
  // la pantalla correspondiente.
  const forceGameOver = useCallback(() => {
    if (over || myOverStore) return;
    forceEndRef.current = false;
    setShowForceEnd(false);
    setOver(true);
    $myOver.set(true);
    $myTiles.set(engine.getTiles());
    onGameOver(engine.score);
    if (solo) {
      clearSoloGame();
    }
  }, [engine, onGameOver, over, myOverStore, solo]);

  // Controles de teclado.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      // Escape: abre/cierra el modal para finalizar la partida.
      if (event.key === "Escape") {
        if (forceEndRef.current) {
          forceEndRef.current = false;
          setShowForceEnd(false);
        } else if (!spectator) {
          forceEndRef.current = true;
          setShowForceEnd(true);
        }
        return;
      }

      let direction: Direction | null = null;
      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          direction = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          direction = "down";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          direction = "right";
          break;
        default:
          break;
      }

      if (direction) {
        event.preventDefault();
        doMove(direction);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove, spectator]);

  // Cronometro de la sesion (tiempo transcurrido).
  useEffect(() => {
    const update = () =>
      setElapsed(
        sessionStart ? Math.floor((Date.now() - sessionStart) / 1000) : 0
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sessionStart]);

  // En modo un jugador, guarda el estado actual al montar (por si se sale).
  useEffect(() => {
    $myScore.set(engine.score);
    $myTiles.set(engine.getTiles());
    if (solo && !engine.gameOver) {
      saveSoloGame(engine.serialize());
    }
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gestos swipe. Se detecta el desplazamiento en touchmove para responder
  // en cuanto se supera el umbral, y tambien se comprueba en touchend.
  const handleSwipe = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24;

    if (Math.max(absX, absY) < threshold) return;

    if (absX > absY) {
      doMove(dx > 0 ? "right" : "left");
    } else {
      doMove(dy > 0 ? "down" : "up");
    }

    // Reinicia el origen para permitir encadenar movimientos en un mismo gesto.
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchMove = (event: React.TouchEvent) => {
    handleSwipe(event);
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    handleSwipe(event);
    touchStartRef.current = null;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Marcador superior */}
      {solo ? (
        <div className="text-center mb-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-texto-2)]">
            Puntuacion
          </p>
          <p className="text-6xl sm:text-7xl font-extrabold leading-none text-[var(--color-acento)]">
            {score}
          </p>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 max-w-md mx-auto">
          <ScorePill
            label={spectator ? "Espectador" : "Tu"}
            value={score}
            accent="lavanda"
          />
          <ScorePill label="Rival" value={opponentScore} accent="rosa" live />
        </div>
      )}

      {/* Cronometro de sesion y boton de finalizar */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#eee6d8] px-3 py-1.5 text-sm font-semibold text-[var(--color-texto-2)] tabular-nums">
          <ClockIcon className="w-4 h-4" />
          {formatTime(elapsed)}
        </span>
        {!spectator && (
          <button
            type="button"
            onClick={() => {
              forceEndRef.current = true;
              setShowForceEnd(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#eee6d8] px-3 py-1.5 text-sm font-semibold text-[var(--color-texto)] transition-transform hover:scale-105 active:scale-95"
          >
            <FlagIcon className="w-4 h-4" />
            Finalizar
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start justify-center">
        {/* Zona principal */}
        <div className="w-full max-w-md flex-1">
          {spectator ? (
            <div className="fade-in">
              <div
                className="rounded-2xl p-4 mb-4 text-center border"
                style={{ borderColor: "var(--color-celda)" }}
              >
                <p className="font-semibold text-[var(--color-texto)]">
                  Has perdido. Esperando a tu rival...
                </p>
                <p className="text-sm text-[var(--color-texto-2)] mt-1">
                  Tu puntuacion: {score}
                </p>
              </div>
              <Board tiles={opponentTiles} />
              <p className="text-center text-sm text-[var(--color-texto-2)] mt-3">
                {opponentStatus === "reconnecting"
                  ? "Rival reconectando..."
                  : opponentStatus === "left"
                    ? "El rival se desconecto"
                    : "Tablero del rival"}
              </p>
            </div>
          ) : (
            <>
              <div
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
                className="touch-none"
              >
                <Board tiles={tiles} />
              </div>
              <p className="mt-4 text-center text-xs text-[var(--color-texto-2)]">
                Desliza sobre el tablero o usa las flechas del teclado
              </p>
            </>
          )}
        </div>

        {/* Tablero del rival (pequeno) */}
        {!solo && !spectator && (
          <aside
            className={cn(
              "w-full max-w-[200px] lg:w-52 shrink-0 mx-auto lg:mx-0",
              "rounded-2xl bg-white p-3 border border-[#eee6d8]"
            )}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
                Rival
              </p>
              <p className="text-sm font-semibold text-[var(--color-texto)]">
                {opponentScore}
              </p>
            </div>
            <Board tiles={opponentTiles} compact />
            {opponentStatus === "reconnecting" && (
              <p className="text-center text-xs text-[var(--color-acento)] mt-2">
                Rival reconectando...
              </p>
            )}
            {opponentStatus === "left" && (
              <p className="text-center text-xs text-[var(--color-error)] mt-2">
                El rival se desconecto
              </p>
            )}
            {opponentOver && opponentStatus === "online" && (
              <p className="text-center text-xs text-[var(--color-error)] mt-2">
                El rival ha terminado
              </p>
            )}
          </aside>
        )}
      </div>

      {/* Modal para finalizar la partida con Escape */}
      <ConfirmDialog
        open={showForceEnd}
        title="¿Finalizar la partida?"
        message="Se dara por terminada ahora mismo y se mostrara el resultado."
        confirmLabel="Finalizar"
        cancelLabel="Seguir jugando"
        onConfirm={forceGameOver}
        onCancel={() => {
          forceEndRef.current = false;
          setShowForceEnd(false);
        }}
      />
    </div>
  );
}

// Pildora de puntuacion del marcador superior.
function ScorePill({
  label,
  value,
  accent,
  live = false,
}: {
  label: string;
  value: number;
  accent: "lavanda" | "rosa";
  live?: boolean;
}) {
  return (
    <div className="rounded-2xl px-4 py-3 text-center bg-white border border-[#eee6d8]">
      <p className="text-xs uppercase tracking-widest text-[var(--color-texto-2)]">
        {label}
      </p>
      <p
        className={cn(
          "text-3xl font-extrabold tabular-nums",
          accent === "lavanda"
            ? "text-[var(--color-acento)]"
            : "text-[var(--color-acento-2)]"
        )}
      >
        {value}
      </p>
      {live && (
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-texto-2)]">
          en vivo
        </p>
      )}
    </div>
  );
}
