import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { showLocalNotification, requestNotificationPermission } from "@/lib/pushNotifications";

export const useRewardRealtimeNotification = () => {
  const { user } = useAuth();
  const hasRequestedPermission = useRef(false);

  useEffect(() => {
    // Request notification permission on mount
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('reward-approval-notification')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reward_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const oldData = payload.old as { approved?: boolean };
          const newData = payload.new as { approved?: boolean; amount?: number; reward_type?: string };

          // Check if approved changed from false to true
          if (newData.approved === true && oldData.approved === false) {
            const amount = newData.amount || 0;
            
            // Trigger confetti
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
            });

            // Show toast notification
            toast({
              title: "🎉 Reward đã được duyệt!",
              description: `+${amount.toLocaleString('vi-VN')} CAMLY có thể claim ngay! Vào trang Wallet để nhận thưởng.`,
              duration: 8000,
            });

            // Show browser notification
            showLocalNotification(
              "🎉 Reward đã được duyệt!",
              {
                body: `+${amount.toLocaleString('vi-VN')} CAMLY có thể claim ngay!`,
                tag: "reward-approved",
                requireInteraction: true,
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
};
