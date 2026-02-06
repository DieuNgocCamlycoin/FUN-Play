import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useMusicCompletionNotification() {
  const { user } = useAuth();
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('music-completion-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_generated_music',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as { id: string; title: string; status: string };
          const oldRecord = payload.old as { status: string };
          
          if (
            newRecord.status === 'completed' && 
            oldRecord.status !== 'completed' &&
            !notifiedIds.current.has(newRecord.id)
          ) {
            notifiedIds.current.add(newRecord.id);
            toast.success(`🎵 Bài hát "${newRecord.title}" đã hoàn thành!`, {
              description: "Nhấn để xem trong My AI Music",
              duration: 8000,
              action: {
                label: "Xem ngay",
                onClick: () => {
                  window.location.href = "/my-ai-music";
                },
              },
            });
          }
          
          if (
            newRecord.status === 'failed' && 
            oldRecord.status !== 'failed' &&
            !notifiedIds.current.has(newRecord.id)
          ) {
            notifiedIds.current.add(newRecord.id);
            toast.error(`❌ Không thể tạo bài hát "${newRecord.title}"`, {
              description: "Vui lòng thử lại",
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
