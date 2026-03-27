// lib/pusher-client.ts
import Pusher from "pusher-js";

let pusher: Pusher | null = null;

export const getPusherClient = (): Pusher | null => {
  // Prevent SSR crash
  if (typeof window === "undefined") return null;

  // Prevent multiple instances
  if (!pusher) {
    pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }

  return pusher;
};