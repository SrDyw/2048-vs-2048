"use client";

import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { useGame } from "@/hooks/useGame";
import { randomSeed } from "@/lib/prng";
import {
  $countdownFrom,
  $myOver,
  $myScore,
  $opponentLeft,
  $opponentOver,
  $opponentScore,
  $phase,
  $playerName,
  $roomCode,
  $seed,
  $solo,
  resetAll,
  resetMatchState,
} from "@/stores/gameStore";
import { Home } from "./Home";
import { Lobby } from "./Lobby";
import { Countdown } from "./Countdown";
import { GameView } from "./GameView";
import { ResultScreen } from "./ResultScreen";
import { SoloResult } from "./SoloResult";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExitIcon, HomeIcon } from "./icons";

// Componente raiz: gestiona la maquina de estados de la aplicacion.
export function App() {
  const game = useGame();
  const phase = useStore($phase);
  const seed = useStore($seed);
  const myScore = useStore($myScore);
  const opponentScore = useStore($opponentScore);
  const myOver = useStore($myOver);
  const opponentOver = useStore($opponentOver);
  const countdownFrom = useStore($countdownFrom);
  const opponentLeft = useStore($opponentLeft);
  const roomCode = useStore($roomCode);
  const solo = useStore($solo);
  const [showLeave, setShowLeave] = useState(false);

  // Recupera y guarda el nombre del jugador en localStorage.
  useEffect(() => {
    const saved = localStorage.getItem("2048_player_name");
    if (saved) $playerName.set(saved);
    const unsubscribe = $playerName.subscribe((value) => {
      localStorage.setItem("2048_player_name", value);
    });
    return unsubscribe;
  }, []);

  // ----- Modo un jugador -----
  const startSolo = () => {
    resetMatchState();
    $solo.set(true);
    $seed.set(randomSeed());
    $phase.set("playing");
  };

  const replaySolo = () => {
    $myOver.set(false);
    $myScore.set(0);
    $seed.set(randomSeed());
    $phase.set("playing");
  };

  const exitSolo = () => {
    resetAll();
  };

  // Salir de la partida actual (individual o en sala) con confirmacion.
  const confirmLeave = () => {
    setShowLeave(false);
    if (solo) {
      exitSolo();
    } else {
      game.leaveToHome();
    }
  };

  // Pasa a "esperando" cuando yo he terminado pero el rival sigue jugando.
  useEffect(() => {
    if (!solo && myOver && !opponentOver && phase === "playing") {
      $phase.set("waiting");
    }
  }, [solo, myOver, opponentOver, phase]);

  // Modo un jugador: al terminar pasamos al resultado solo.
  useEffect(() => {
    if (solo && myOver && phase === "playing") {
      $phase.set("solo-result");
    }
  }, [solo, myOver, phase]);

  // Cuando ambos terminan, mostramos el resultado.
  useEffect(() => {
    if (
      !solo &&
      myOver &&
      opponentOver &&
      (phase === "playing" || phase === "waiting")
    ) {
      $phase.set("result");
    }
  }, [solo, myOver, opponentOver, phase]);

  const showDisconnectOverlay =
    !solo && opponentLeft && roomCode !== "" && phase !== "home";

  return (
    <main className="min-h-screen w-full px-4 py-8 sm:py-12 flex items-start sm:items-center justify-center">
      {/* Boton de inicio (salir de la sala o del modo solo) */}
      {phase !== "home" && (
        <button
          type="button"
          onClick={() => setShowLeave(true)}
          aria-label="Salir al inicio"
          title="Salir al inicio"
          className="fixed top-4 left-4 z-[60] flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-[#eee6d8] text-[var(--color-texto)] shadow-[var(--shadow-suave)] transition-transform hover:scale-105 active:scale-95"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      )}

      {phase === "home" && (
        <Home
          onCreate={game.createRoom}
          onJoin={game.joinRoom}
          onSolo={startSolo}
        />
      )}

      {phase === "lobby" && (
        <Lobby
          onToggleReady={game.toggleReady}
          onStart={game.startGame}
          onLeave={game.leaveToHome}
        />
      )}

      {phase === "countdown" && (
        <Countdown
          from={countdownFrom}
          onComplete={() => $phase.set("playing")}
        />
      )}

      {phase === "playing" && seed !== null && (
        <GameView
          key={seed}
          seed={seed}
          solo={solo}
          onSendMove={game.sendMove}
          onGameOver={solo ? () => {} : game.sendGameOver}
        />
      )}

      {phase === "playing" && seed === null && (
        <p className="text-[var(--color-texto-2)]">Sincronizando partida...</p>
      )}

      {phase === "waiting" && seed !== null && (
        <GameView
          key={seed}
          seed={seed}
          onSendMove={game.sendMove}
          onGameOver={game.sendGameOver}
        />
      )}

      {phase === "solo-result" && (
        <SoloResult score={myScore} onReplay={replaySolo} onExit={exitSolo} />
      )}

      {phase === "result" && (
        <ResultScreen
          myScore={myScore}
          opponentScore={opponentScore}
          onRequestRematch={game.requestRematch}
          onAcceptRematch={game.acceptRematch}
          onRejectRematch={game.rejectRematch}
          onLeave={game.leaveToHome}
        />
      )}

      {/* Aviso de rival desconectado */}
      {showDisconnectOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-crema)]/85 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-suave)] p-6 text-center border border-white">
            <p className="text-lg font-semibold text-[var(--color-texto)]">
              Rival desconectado
            </p>
            <p className="mt-2 text-sm text-[var(--color-texto-2)]">
              Puedes esperar a que vuelva o salir al inicio.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => $opponentLeft.set(false)}
                className="flex-1 py-3 rounded-2xl bg-[var(--color-acento)] text-white font-semibold"
              >
                Esperar
              </button>
              <button
                type="button"
                onClick={game.leaveToHome}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-[var(--color-texto)] border border-[var(--color-celda)] font-semibold"
              >
                <ExitIcon className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmacion para salir */}
      <ConfirmDialog
        open={showLeave}
        title="¿Salir al inicio?"
        message={
          solo
            ? "Se perdera el progreso de la partida."
            : "Si sales, la sala se cerrara para ambos jugadores."
        }
        confirmLabel="Salir"
        cancelLabel="Seguir jugando"
        onConfirm={confirmLeave}
        onCancel={() => setShowLeave(false)}
      />
    </main>
  );
}

export default App;
