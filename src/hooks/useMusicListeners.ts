import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useMusicListeners(musicId: string | null, isActive: boolean) {
  const [listenerCount, setListenerCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!musicId || !isActive) {
      setListenerCount(0);
      return;
    }

    const channelName = `music-listeners:${musicId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setListenerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user?.id || 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [musicId, isActive, user?.id]);

  return listenerCount;
}
