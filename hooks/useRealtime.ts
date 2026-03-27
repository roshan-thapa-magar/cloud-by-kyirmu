import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { getPusherClient } from '@/lib/pusher-client';

interface UseRealtimeOptions {
  channelName: string;
  eventName: string;
  onEvent: (data: any) => void;
  dependencies?: any[];
}

export const useRealtime = ({ 
  channelName, 
  eventName, 
  onEvent, 
  dependencies = [] 
}: UseRealtimeOptions) => {
  const callbackRef = useRef(onEvent);
  
  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);
    
    const handleEvent = (data: any) => {
      callbackRef.current(data);
    };
    
    channel.bind(eventName, handleEvent);
    
    return () => {
      channel.unbind(eventName, handleEvent);
      pusher.unsubscribe(channelName);
    };
  }, [channelName, eventName, ...dependencies]);
};