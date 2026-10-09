import Pusher from "pusher";

// Cliente de Pusher del lado servidor. Se usa en las API routes para
// emitir eventos a los canales de presencia de cada sala.
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export { pusherServer };

// Emite un evento a un canal.
export async function triggerEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<void> {
  await pusherServer.trigger(channel, event, data);
}

// Consulta cuantos suscriptores tiene un canal (para validar salas).
// Pusher devuelve un objeto Response (fetch), y el JSON debe leerse con .json().
// Para canales de presencia hay que pedir explicitamente "subscription_count".
// Devuelve 0 si el canal no existe o no esta ocupado.
export async function getChannelSubscriptionCount(
  channel: string
): Promise<number> {
  try {
    const response = await pusherServer.get({
      path: `/channels/${channel}`,
      params: { info: "subscription_count" },
    });

    if (!response.ok) return 0;

    const body = (await response.json()) as {
      occupied?: boolean;
      subscription_count?: number;
    };

    if (!body.occupied) return 0;
    return typeof body.subscription_count === "number"
      ? body.subscription_count
      : 1;
  } catch {
    // Pusher devuelve error si el canal no existe.
    return 0;
  }
}
