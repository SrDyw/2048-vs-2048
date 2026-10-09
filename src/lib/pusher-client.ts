import Pusher from "pusher-js";

// Cliente de Pusher del navegador. Singleton para reutilizar la conexion.
let pusherClient: Pusher | null = null;

// Nombre del jugador actual. Se envia al endpoint de auth para el canal de
// presencia (user_info.name). Se lee en cada peticion de autorizacion, asi que
// puede cambiarse antes de suscribirse.
let playerName = "Jugador";

export function setPusherPlayerName(name: string) {
  playerName = name.trim() || "Jugador";
}

export function getPusherClient(): Pusher {
  if (pusherClient) return pusherClient;

  Pusher.logToConsole = false;

  pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    channelAuthorization: {
      transport: "ajax",
      endpoint: "/api/pusher/auth",
      paramsProvider: () => ({ name: playerName }),
    },
  });

  return pusherClient;
}

export function subscribeToChannel(channelName: string) {
  return getPusherClient().subscribe(channelName);
}

export function unsubscribeFromChannel(channelName: string) {
  getPusherClient().unsubscribe(channelName);
}
