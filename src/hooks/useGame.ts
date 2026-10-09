"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import {
  getPusherClient,
  subscribeToChannel,
  unsubscribeFromChannel,
  setPusherPlayerName,
} from "@/lib/pusher-client";
import {
  roomChannel,
  type ServerEvent,
  type CountdownStartPayload,
  type GameStartPayload,
  type OpponentBoardPayload,
  type OpponentGameOverPayload,
  type ReadyUpdatePayload,
  type RematchPayload,
  type PlayerLeftPayload,
} from "@/lib/protocol";
import type { GameSnapshot } from "@/lib/game2048";
import {
  $busy,
  $connected,
  $countdownFrom,
  $error,
  $isHost,
  $myId,
  $opponentOver,
  $opponentScore,
  $opponentStatus,
  $opponentTiles,
  $phase,
  $reconnecting,
  $playerName,
  $players,
  $rematchPending,
  $rematchRejected,
  $rematchRequested,
  $roomCode,
  $seed,
  resetAll,
  resetMatchState,
  type PlayerInfo,
} from "@/stores/gameStore";

// Caracteres sin ambiguedad (sin 0/O/1/I) para los codigos de sala.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

interface PresenceMember {
  id: string;
  info?: { name?: string };
}

interface PresenceChannelLike {
  members: {
    myID: string | null;
    each: (cb: (member: PresenceMember) => void) => void;
  };
  bind: (event: string, cb: (data: unknown) => void) => void;
  unbind_all?: () => void;
}

export function useGame() {
  const channelRef = useRef<PresenceChannelLike | null>(null);
  // Reactivo al codigo de sala para suscribirse cuando cambie.
  const roomCode = useStore($roomCode);
  // Handshake de union: el que se une pregunta y el host responde.
  const joiningRef = useRef(false);
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tiempo de gracia antes de considerar al rival desconectado definitivamente.
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const OPPONENT_GRACE_MS = 30000;

  // Vigila el estado de nuestra propia conexion a Pusher (reconexion).
  useEffect(() => {
    let pusher: ReturnType<typeof getPusherClient> | null = null;
    try {
      pusher = getPusherClient();
    } catch {
      return;
    }
    const onChange = (states: { current: string }) => {
      const connected = states.current === "connected";
      $connected.set(connected);
      $reconnecting.set(!connected);
    };
    pusher.connection.bind("state_change", onChange);
    return () => {
      pusher?.connection.unbind("state_change", onChange);
    };
  }, []);

  // Envia un comando/evento al endpoint que dispara Pusher.
  const trigger = useCallback(
    async (
      event: ServerEvent | "start_game",
      data: Record<string, unknown> = {}
    ) => {
      const code = $roomCode.get();
      if (!code) return;
      try {
        await fetch("/api/game/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, event, data }),
        });
      } catch {
        // Silencioso: la partida puede continuar sin red puntualmente.
      }
    },
    []
  );

  // ----- Acciones de sala -----
  const createRoom = useCallback(async () => {
    $error.set("");
    // No esperamos a comprobar colisiones (esa llamada a Pusher puede tardar):
    // generamos el codigo y entramos al lobby de inmediato. Un hipotetico
    // choque de codigos es practicamente imposible con 32^6 combinaciones.
    const code = generateRoomCode();
    setPusherPlayerName($playerName.get());
    $isHost.set(true);
    $roomCode.set(code);
    $phase.set("lobby");
  }, []);

  const joinRoom = useCallback(async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    $error.set("");

    if (code.length !== 6) {
      $error.set("El codigo debe tener 6 caracteres");
      return;
    }

    // Nos suscribimos al canal y preguntamos si hay alguien. El host
    // respondera por el propio canal (mas fiable que consultar la REST API).
    joiningRef.current = true;
    setPusherPlayerName($playerName.get());
    $busy.set(true);
    $isHost.set(false);
    $roomCode.set(code);

    // Si nadie responde en unos segundos, la sala no existe.
    if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
    joinTimeoutRef.current = setTimeout(() => {
      if (!joiningRef.current) return;
      joiningRef.current = false;
      $busy.set(false);
      $error.set(
        $connected.get()
          ? "La sala no existe"
          : "No se pudo conectar al servicio en tiempo real"
      );
      $roomCode.set("");
    }, 4500);
  }, []);

  const toggleReady = useCallback(async () => {
    const myId = $myId.get();
    const players = $players.get();
    const me = players.find((p) => p.id === myId);
    const ready = !(me?.ready ?? false);

    $players.set(players.map((p) => (p.id === myId ? { ...p, ready } : p)));
    await trigger("ready_update", { senderId: myId, ready });
  }, [trigger]);

  const startGame = useCallback(async () => {
    // Solo el host y solo si ambos estan listos.
    if (!$isHost.get()) return;
    const players = $players.get();
    if (players.length < 2 || !players.every((p) => p.ready)) return;

    $busy.set(true);
    try {
      await trigger("countdown_start", { from: 3 });
      await trigger("start_game", {});
    } finally {
      $busy.set(false);
    }
  }, [trigger]);

  const sendMove = useCallback(
    async (snapshot: GameSnapshot) => {
      await trigger("opponent_board", {
        senderId: $myId.get(),
        tiles: snapshot.tiles,
        score: snapshot.score,
      });
    },
    [trigger]
  );

  const sendGameOver = useCallback(
    async (score: number) => {
      await trigger("opponent_game_over", {
        senderId: $myId.get(),
        score,
      });
    },
    [trigger]
  );

  const requestRematch = useCallback(async () => {
    $rematchRequested.set(false);
    $rematchRejected.set(false);
    $rematchPending.set(true);
    await trigger("rematch_requested", { senderId: $myId.get() });
  }, [trigger]);

  const acceptRematch = useCallback(async () => {
    $busy.set(true);
    try {
      await trigger("rematch_accepted", { senderId: $myId.get() });
      resetMatchState();
      $phase.set("lobby");
    } finally {
      $busy.set(false);
    }
  }, [trigger]);

  const rejectRematch = useCallback(async () => {
    $rematchPending.set(false);
    await trigger("rematch_rejected", { senderId: $myId.get() });
    $rematchRejected.set(true);
  }, [trigger]);

  const leaveToHome = useCallback(() => {
    const code = $roomCode.get();
    const myId = $myId.get();
    if (code) {
      // Avisa al rival sin bloquear la salida (aunque la red falle).
      trigger("player_left", { senderId: myId }).catch(() => {});
      unsubscribeFromChannel(roomChannel(code));
    }
    channelRef.current = null;
    resetAll();
  }, [trigger]);

  // ----- Suscripcion al canal de presencia -----
  useEffect(() => {
    if (!roomCode) return;

    const channelName = roomChannel(roomCode);
    let channel: PresenceChannelLike;
    try {
      channel = subscribeToChannel(channelName) as unknown as PresenceChannelLike;
    } catch {
      // Suele ocurrir si falta la clave publica de Pusher.
      joiningRef.current = false;
      $busy.set(false);
      $error.set("No se pudo conectar al servicio en tiempo real");
      $roomCode.set("");
      return;
    }
    channelRef.current = channel;

    const syncMembers = () => {
      const list: PlayerInfo[] = [];
      channel.members.each((member) => {
        const existing = $players.get().find((p) => p.id === member.id);
        list.push({
          id: member.id,
          name: member.info?.name ?? "Jugador",
          ready: existing?.ready ?? false,
        });
      });
      $players.set(list);
    };

    channel.bind("pusher:subscription_succeeded", () => {
      const myId = channel.members.myID ?? "";
      $myId.set(myId);
      $connected.set(true);
      syncMembers();

      // Si estamos intentando entrar, preguntamos si hay alguien.
      if (joiningRef.current) {
        trigger("room_probe", { senderId: myId });
      }
    });

    // El host responde a las peticiones de union.
    channel.bind("room_probe", (data: unknown) => {
      const payload = data as RematchPayload;
      if (payload.senderId === $myId.get()) return;
      if (!$isHost.get()) return;
      if ($phase.get() !== "lobby") return;

      let members = 0;
      channel.members.each(() => {
        members++;
      });

      if (members > 2) {
        trigger("room_full", { senderId: $myId.get() });
      } else {
        trigger("room_here", { senderId: $myId.get() });
      }
    });

    // Respuesta afirmativa: entramos al lobby.
    channel.bind("room_here", (data: unknown) => {
      const payload = data as RematchPayload;
      if (payload.senderId === $myId.get()) return;
      if (!joiningRef.current) return;
      joiningRef.current = false;
      if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
      $busy.set(false);
      $phase.set("lobby");
    });

    // Sala llena.
    channel.bind("room_full", (data: unknown) => {
      const payload = data as RematchPayload;
      if (payload.senderId === $myId.get()) return;
      if (!joiningRef.current) return;
      joiningRef.current = false;
      if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
      $busy.set(false);
      $error.set("La sala esta llena");
      $roomCode.set("");
    });

    channel.bind("pusher:member_added", () => {
      syncMembers();
      // El rival (re)aparece: cancelamos el tiempo de gracia.
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
      $opponentStatus.set("online");
    });

    channel.bind("pusher:member_removed", (data: unknown) => {
      const member = data as PresenceMember;
      if (member.id !== $myId.get()) {
        // Damos un tiempo de gracia por si solo fue una caida de conexion.
        $opponentStatus.set("reconnecting");
        if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
        opponentTimerRef.current = setTimeout(() => {
          if ($opponentStatus.get() === "reconnecting") {
            $opponentStatus.set("left");
          }
        }, OPPONENT_GRACE_MS);
      }
      syncMembers();
    });

    channel.bind("ready_update", (data: unknown) => {
      const payload = data as ReadyUpdatePayload;
      if (payload.senderId === $myId.get()) return;
      $players.set(
        $players
          .get()
          .map((p) =>
            p.id === payload.senderId ? { ...p, ready: payload.ready } : p
          )
      );
    });

    // El primero de countdown_start / game_start en llegar arranca la cuenta.
    channel.bind("countdown_start", (data: unknown) => {
      const payload = data as CountdownStartPayload;
      if ($phase.get() !== "lobby") return;
      $countdownFrom.set(payload.from ?? 3);
      $phase.set("countdown");
    });

    channel.bind("game_start", (data: unknown) => {
      const payload = data as GameStartPayload;
      $seed.set(payload.seed);
      // Si el countdown no llego todavia, lo iniciamos aqui.
      if ($phase.get() === "lobby") {
        $phase.set("countdown");
      }
    });

    channel.bind("opponent_board", (data: unknown) => {
      const payload = data as OpponentBoardPayload;
      if (payload.senderId === $myId.get()) return;
      $opponentTiles.set(payload.tiles);
      $opponentScore.set(payload.score);
    });

    channel.bind("opponent_game_over", (data: unknown) => {
      const payload = data as OpponentGameOverPayload;
      if (payload.senderId === $myId.get()) return;
      $opponentScore.set(payload.score);
      $opponentOver.set(true);
    });

    channel.bind("rematch_requested", (data: unknown) => {
      const payload = data as RematchPayload;
      if (payload.senderId === $myId.get()) return;
      $rematchRejected.set(false);
      $rematchRequested.set(true);
    });

    channel.bind("rematch_accepted", () => {
      resetMatchState();
      $phase.set("lobby");
    });

    channel.bind("rematch_rejected", () => {
      $rematchPending.set(false);
      $rematchRejected.set(true);
    });

    channel.bind("player_left", (data: unknown) => {
      const payload = data as PlayerLeftPayload;
      if (payload.senderId === $myId.get()) return;
      // Salida explicita: se considera desconectado tras el tiempo de gracia.
      $opponentStatus.set("reconnecting");
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
      opponentTimerRef.current = setTimeout(() => {
        $opponentStatus.set("left");
      }, OPPONENT_GRACE_MS);
    });

    return () => {
      if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
      if (opponentTimerRef.current) clearTimeout(opponentTimerRef.current);
      joiningRef.current = false;
      channel.unbind_all?.();
      unsubscribeFromChannel(channelName);
      channelRef.current = null;
      $connected.set(false);
      $players.set([]);
    };
  }, [roomCode]);

  return {
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    sendMove,
    sendGameOver,
    requestRematch,
    acceptRematch,
    rejectRematch,
    leaveToHome,
  };
}
