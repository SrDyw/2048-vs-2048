import Pusher from "pusher-js";

// Cliente de Pusher del navegador. Singleton para reutilizar la conexion.
let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (pusherClient) return pusherClient;

  Pusher.logToConsole = false;

  pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    authEndpoint: "/api/pusher/auth",
  });

  return pusherClient;
}

export function subscribeToChannel(channelName: string) {
  return getPusherClient().subscribe(channelName);
}

export function unsubscribeFromChannel(channelName: string) {
  getPusherClient().unsubscribe(channelName);
}
