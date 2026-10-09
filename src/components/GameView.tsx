"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { GameEngine, type Direction, type GameSnapshot } from "@/lib/game2048";
import { MERGE_MS, prefersReducedMotion, slideDuration } from "@/lib/animations";
import {
  $myOver,
  $myScore,
  $myTiles,
  $opponentOver,
  $opponentScore,
  $opponentTiles,
} from "@/stores/gameStore";
import { cn } from "@/lib/cn";
import { Board } from "./Board";

interface GameViewProps {
  seed: number;
  onSendMove: (snapshot: GameSnapshot) => void;
  onGameOver: (score: number) => void;
  // Modo un jugador: sin tablero rival ni envio de eventos.
  solo?: boolean;
}

// Vista de partida: tablero propio grande + tablero del rival pequeno.
export function GameView({
  seed,
  onSendMove,
  onGameOver,
  solo = false,
}: GameViewProps) {
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new GameEngine(seed);
  }
  const engine = engineRef.current;

  const [tiles, setTiles] = useState(() => engine.getTiles());
  const [score, setScore] = useState(engine.score);
  const [over, setOver] = useState(false);

  const lockedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const opponentTiles = useStore($opponentTiles);
  const opponentScore = useStore($opponentScore);
  const opponentOver = useStore($opponentOver);
  const myOverStore = useStore($myOver);

  // En solo nunca se muestra el modo espectador.
  const spectator = solo ? false : over || myOverStore;

  const doMove = useCallback(
    (direction: Direction) => {
      if (lockedRef.current || spectator) return;

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

        const unlock = reduce ? 0 : MERGE_MS;
        window.setTimeout(() => {
          lockedRef.current = false;
        }, unlock);
      }, phase1Delay);
    },
    [engine, onSendMove, onGameOver, spectator, solo]
  );

  // Controles de teclado.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
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
  }, [doMove]);

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
                Tablero del rival
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
            {opponentOver && (
              <p className="text-center text-xs text-[var(--color-error)] mt-2">
                El rival ha terminado
              </p>
            )}
          </aside>
        )}
      </div>
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
