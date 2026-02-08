import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { showLocalNotification, requestNotificationPermission } from "@/lib/pushNotifications";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const useRewardRealtimeNotification = () => {
  const { user } = useAuth();
  const hasRequestedPermission = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, []);

  useEffect(() => {
    const userId = user?.id;

    // If already subscribed for this user, skip
    if (userId && subscribedUserIdRef.current === userId && channelRef.current) {
      return;
    }

    // Cleanup previous channel if user changed
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      subscribedUserIdRef.current = null;
    }

    if (!userId) return;

    const channel = supabase
      .channel(`reward-approval-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reward_transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const oldData = payload.old as { approved?: boolean };
          const newData = payload.new as { approved?: boolean; amount?: number; reward_type?: string };

          if (newData.approved === true && oldData.approved === false) {
            const amount = newData.amount || 0;
            
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
            });

            toast({
              title: "🎉 Reward đã được duyệt!",
              description: `+${amount.toLocaleString('vi-VN')} CAMLY có thể claim ngay! Vào trang Wallet để nhận thưởng.`,
              duration: 8000,
            });

            showLocalNotification(
              "🎉 Reward đã được duyệt!",
              {
                body: `+${amount.toLocaleString('vi-VN')} CAMLY có thể claim ngay!`,
                tag: "reward-approved",
                requireInteraction: true,
              }
            );

            window.dispatchEvent(new CustomEvent("camly-reward", { 
              detail: { approved: true, amount } 
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    subscribedUserIdRef.current = userId;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        subscribedUserIdRef.current = null;
      }
    };
  }, [user?.id]);
};
