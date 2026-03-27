import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

export const getPusherClient = () => {
  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    });
  }
  return pusherClient;
};

export const subscribeToChannel = (channelName: string, eventName: string, callback: (data: any) => void) => {
  const pusher = getPusherClient();
  const channel = pusher.subscribe(channelName);
  channel.bind(eventName, callback);
  
  return () => {
    channel.unbind(eventName, callback);
    pusher.unsubscribe(channelName);
  };
};