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
// Devuelve 0 si el canal no existe todavia.
export async function getChannelSubscriptionCount(
  channel: string
): Promise<number> {
  try {
    const response = await pusherServer.get({
      path: `/channels/${channel}`,
    });
    const body = response.body as { subscription_count?: number };
    return body.subscription_count ?? 0;
  } catch {
    // Pusher devuelve error si el canal no existe.
    return 0;
  }
}
