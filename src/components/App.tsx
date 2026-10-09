"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { useGame } from "@/hooks/useGame";
import { randomSeed } from "@/lib/prng";
import { clearSoloGame, hasSoloSave, loadSoloGame } from "@/lib/soloSave";
import { shareResult } from "@/lib/share";
import {
  $countdownFrom,
  $myOver,
  $myScore,
  $myTiles,
  $opponentOver,
  $opponentScore,
  $opponentTiles,
  $phase,
  $playerName,
  $reconnecting,
  $seed,
  $sessionStart,
  $solo,
  $soloRound,
  $soloSaved,
  $newRecord,
  initHistory,
  recordMatch,
  resetAll,
  resetMatchState,
} from "@/stores/gameStore";
import { Home } from "./Home";
import { Lobby } from "./Lobby";
import { Countdown } from "./Countdown";
import { GameView } from "./GameView";
import { ResultScreen } from "./ResultScreen";
import { SoloResult } from "./SoloResult";
import { SoloStartDialog } from "./SoloStartDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { HomeIcon, ShareIcon, SpinnerIcon } from "./icons";

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
  const reconnecting = useStore($reconnecting);
  const solo = useStore($solo);
  const soloRound = useStore($soloRound);
  const soloSaved = useStore($soloSaved);
  const myTiles = useStore($myTiles);
  const opponentTiles = useStore($opponentTiles);
  const [showLeave, setShowLeave] = useState(false);
  const [showSoloMenu, setShowSoloMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const matchRecordedRef = useRef(false);

  // Carga el historial guardado en localStorage.
  useEffect(() => {
    initHistory();
  }, []);

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
  // Empieza una partida nueva (descarta la guardada).
  const startSolo = () => {
    resetMatchState();
    clearSoloGame();
    $soloSaved.set(null);
    $solo.set(true);
    $seed.set(randomSeed());
    $soloRound.set($soloRound.get() + 1);
    $phase.set("playing");
  };

  // Continua la partida guardada.
  const continueSolo = () => {
    const saved = loadSoloGame();
    if (!saved) {
      startSolo();
      return;
    }
    resetMatchState();
    $soloSaved.set(saved);
    $solo.set(true);
    $seed.set(0);
    $soloRound.set($soloRound.get() + 1);
    $phase.set("playing");
  };

  // Al pulsar "Jugar solo": si hay partida guardada, ofrece continuar o nueva.
  const handleSolo = () => {
    if (hasSoloSave()) {
      setShowSoloMenu(true);
    } else {
      startSolo();
    }
  };

  const replaySolo = () => {
    startSolo();
  };

  const exitSolo = () => {
    // La partida queda guardada en localStorage para poder continuarla.
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

  // Marca el inicio de la partida al entrar en "playing".
  useEffect(() => {
    if (phase === "playing" && $sessionStart.get() === 0) {
      $sessionStart.set(Date.now());
    }
  }, [phase]);

  // Registra en el historial la partida terminada (una vez por partida).
  useEffect(() => {
    if (phase === "playing" || phase === "countdown" || phase === "lobby") {
      matchRecordedRef.current = false;
      $newRecord.set(false);
      return;
    }
    if (matchRecordedRef.current) return;

    const start = $sessionStart.get();
    const durationMs = start ? Date.now() - start : undefined;

    if (phase === "solo-result") {
      matchRecordedRef.current = true;
      recordMatch({ mode: "solo", score: myScore, result: "solo", durationMs });
    } else if (phase === "result") {
      matchRecordedRef.current = true;
      const result =
        myScore > opponentScore
          ? "win"
          : myScore < opponentScore
            ? "lose"
            : "draw";
      recordMatch({
        mode: "vs",
        score: myScore,
        opponentScore,
        result,
        durationMs,
      });
    }
  }, [phase, myScore, opponentScore]);

  // Comparte el estado actual (disponible en cualquier momento de la partida).
  const handleShare = async () => {
    setSharing(true);
    try {
      let headline: string;
      if (solo) {
        headline = myOver ? "Partida terminada" : "Partida en curso";
      } else if (phase === "result") {
        headline =
          myScore > opponentScore
            ? "¡Ganaste!"
            : myScore < opponentScore
              ? "Perdiste"
              : "Empate";
      } else {
        headline = "Partida en curso";
      }
      await shareResult({
        headline,
        myScore,
        opponentScore,
        myTiles,
        opponentTiles,
        solo,
      });
    } catch {
      // Si falla, no interrumpimos.
    } finally {
      setSharing(false);
    }
  };

  return (
    <main className="min-h-screen w-full px-4 py-8 sm:py-12 flex items-center justify-center">
      {/* Barra superior: inicio y compartir (disponible siempre) */}
      {phase !== "home" && (
        <div className="fixed top-4 left-4 z-[60] flex gap-2">
          <button
            type="button"
            onClick={() => setShowLeave(true)}
            aria-label="Salir al inicio"
            title="Salir al inicio"
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-[#eee6d8] text-[var(--color-texto)] shadow-[var(--shadow-suave)] transition-transform hover:scale-105 active:scale-95"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Compartir"
            title="Compartir"
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-[#eee6d8] text-[var(--color-texto)] shadow-[var(--shadow-suave)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {sharing ? (
              <SpinnerIcon className="w-5 h-5" />
            ) : (
              <ShareIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {/* Aviso de reconexion propia */}
      {reconnecting && phase !== "home" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-[var(--color-acento)] text-white px-4 py-2 text-sm font-semibold shadow-[var(--shadow-suave)]">
          <SpinnerIcon className="w-4 h-4" />
          Reconectando...
        </div>
      )}

      {phase === "home" && (
        <Home
          onCreate={game.createRoom}
          onJoin={game.joinRoom}
          onSolo={handleSolo}
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

      {phase === "playing" && (solo || seed !== null) && (
        <GameView
          key={solo ? `solo-${soloRound}` : seed}
          seed={seed ?? 0}
          solo={solo}
          saved={solo ? soloSaved : null}
          onSendMove={game.sendMove}
          onGameOver={solo ? () => {} : game.sendGameOver}
        />
      )}

      {phase === "playing" && !solo && seed === null && (
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

      {/* Confirmacion para salir */}
      <ConfirmDialog
        open={showLeave}
        title="¿Salir al inicio?"
        message={
          solo
            ? "Tu partida se guardara y podras continuarla cuando quieras."
            : "Si sales, la sala se cerrara para ambos jugadores."
        }
        confirmLabel="Salir"
        cancelLabel="Seguir jugando"
        onConfirm={confirmLeave}
        onCancel={() => setShowLeave(false)}
      />

      {/* Eleccion al jugar solo con partida guardada */}
      <SoloStartDialog
        open={showSoloMenu}
        onContinue={() => {
          setShowSoloMenu(false);
          continueSolo();
        }}
        onNew={() => {
          setShowSoloMenu(false);
          startSolo();
        }}
        onCancel={() => setShowSoloMenu(false)}
      />
    </main>
  );
}

export default App;
