import { NextResponse } from "next/server";
import { getChannelSubscriptionCount } from "@/lib/pusher";
import { roomChannel } from "@/lib/protocol";

// Valida si una sala existe y si tiene hueco. Para ello consulta el numero
// de suscriptores del canal de presencia en Pusher (stateless).
export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };

  if (!code || code.length !== 6) {
    return NextResponse.json(
      { ok: false, error: "Codigo de sala invalido" },
      { status: 400 }
    );
  }

  const count = await getChannelSubscriptionCount(roomChannel(code));

  if (count === 0) {
    return NextResponse.json({ ok: false, error: "La sala no existe" });
  }

  if (count >= 2) {
    return NextResponse.json({ ok: false, error: "La sala esta llena" });
  }

  return NextResponse.json({ ok: true });
}
