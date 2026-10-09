import { NextResponse } from "next/server";
import { triggerEvent } from "@/lib/pusher";
import { roomChannel, type ServerEvent } from "@/lib/protocol";
import { randomSeed } from "@/lib/prng";

// Eventos que los clientes pueden disparar sobre un canal.
const ALLOWED_EVENTS: ServerEvent[] = [
  "room_probe",
  "room_here",
  "room_full",
  "ready_update",
  "countdown_start",
  "opponent_board",
  "opponent_game_over",
  "match_result",
  "rematch_requested",
  "rematch_accepted",
  "rematch_rejected",
  "player_left",
];

interface EventBody {
  code?: string;
  event?: string;
  data?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const { code, event, data } = (await request.json()) as EventBody;

  if (!code || !event) {
    return NextResponse.json(
      { error: "Faltan parametros" },
      { status: 400 }
    );
  }

  const channel = roomChannel(code);

  // "start_game" es un comando especial: el servidor genera la semilla
  // compartida y emite "game_start" con ella.
  if (event === "start_game") {
    const seed = randomSeed();
    await triggerEvent(channel, "game_start", { seed });
    return NextResponse.json({ ok: true, seed });
  }

  if (!ALLOWED_EVENTS.includes(event as ServerEvent)) {
    return NextResponse.json(
      { error: "Evento no permitido" },
      { status: 400 }
    );
  }

  await triggerEvent(channel, event, data ?? {});
  return NextResponse.json({ ok: true });
}
