import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

// Lee el cuerpo de la peticion aceptando JSON o application/x-www-form-urlencoded.
// pusher-js envia por defecto el formato form-urlencoded (socket_id=...&channel_name=...).
async function readBody(
  request: Request
): Promise<Record<string, string>> {
  const text = await request.text();
  if (!text) return {};

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as Record<string, string>;
    } catch {
      return {};
    }
  }

  // Por defecto interpretamos como formulario.
  const params = new URLSearchParams(text);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Autenticacion de canales de presencia.
export async function POST(request: Request) {
  const body = await readBody(request);
  const socketId = body.socket_id;
  const channelName = body.channel_name;

  if (!socketId || !channelName) {
    return NextResponse.json(
      { error: "Faltan parametros de autenticacion" },
      { status: 400 }
    );
  }

  // Solo permitimos canales de presencia del juego.
  if (!channelName.startsWith("presence-game-")) {
    return NextResponse.json({ error: "Canal no permitido" }, { status: 403 });
  }

  const auth = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: socketId,
    user_info: {
      name: "Jugador",
    },
  });

  return NextResponse.json(auth);
}
