"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { subscribeToChannel, unsubscribeFromChannel } from "@/lib/pusher-client";
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
  $opponentLeft,
  $opponentOver,
  $opponentScore,
  $opponentTiles,
  $phase,
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

    $busy.set(true);
    try {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (!body.ok) {
        $error.set(body.error ?? "No se pudo unir a la sala");
        return;
      }
    } catch {
      $error.set("Error de conexion. Intenta de nuevo");
      return;
    } finally {
      $busy.set(false);
    }

    $isHost.set(false);
    $roomCode.set(code);
    $phase.set("lobby");
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

  const leaveToHome = useCallback(async () => {
    const code = $roomCode.get();
    if (code) {
      await trigger("player_left", { senderId: $myId.get() });
      unsubscribeFromChannel(roomChannel(code));
    }
    channelRef.current = null;
    resetAll();
  }, [trigger]);

  // ----- Suscripcion al canal de presencia -----
  useEffect(() => {
    if (!roomCode) return;

    const channelName = roomChannel(roomCode);
    const channel = subscribeToChannel(channelName) as unknown as PresenceChannelLike;
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
      $myId.set(channel.members.myID ?? "");
      $connected.set(true);
      syncMembers();
    });

    channel.bind("pusher:member_added", () => {
      syncMembers();
      $opponentLeft.set(false);
    });

    channel.bind("pusher:member_removed", (data: unknown) => {
      const member = data as PresenceMember;
      if (member.id !== $myId.get()) {
        $opponentLeft.set(true);
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
      $opponentLeft.set(true);
    });

    return () => {
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
