import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LiveChatMessage = {
  id: string;
  livestream_id: string;
  user_id: string;
  content: string;
  message_type: string;
  is_deleted?: boolean;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string;
  };
};

export function useLiveChat(livestreamId: string) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("livestream_chat")
        .select("*")
        .eq("livestream_id", livestreamId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, username")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        setMessages(
          data.map((m) => ({
            ...m,
            profile: profileMap.get(m.user_id) as LiveChatMessage["profile"],
          }))
        );
      }
      setIsLoading(false);
    };

    loadMessages();
  }, [livestreamId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`live-chat-${livestreamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livestream_chat",
          filter: `livestream_id=eq.${livestreamId}`,
        },
        async (payload) => {
          const msg = payload.new as LiveChatMessage;
          if (msg.is_deleted) return;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, username")
            .eq("id", msg.user_id)
            .single();

          setMessages((prev) => [
            ...prev.slice(-199),
            { ...msg, profile: profile as LiveChatMessage["profile"] },
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "livestream_chat",
          filter: `livestream_id=eq.${livestreamId}`,
        },
        (payload) => {
          const updated = payload.new as LiveChatMessage;
          if (updated.is_deleted) {
            setMessages((prev) => prev.filter((m) => m.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [livestreamId]);

  const sendMessage = useCallback(
    async (content: string, messageType: string = "text") => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("livestream_chat").insert({
        livestream_id: livestreamId,
        user_id: user.id,
        content,
        message_type: messageType,
      });

      if (error) {
        // Check if banned
        if (error.message?.includes("row-level security")) {
          throw new Error("Bạn đã bị cấm chat trong buổi phát sóng này");
        }
        throw error;
      }
    },
    [livestreamId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await supabase
        .from("livestream_chat")
        .update({ is_deleted: true })
        .eq("id", messageId);
    },
    []
  );

  const banUser = useCallback(
    async (userId: string, reason?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("livestream_bans").insert({
        livestream_id: livestreamId,
        user_id: userId,
        banned_by: user.id,
        reason: reason || "Vi phạm quy tắc chat",
      });
    },
    [livestreamId]
  );

  return { messages, isLoading, sendMessage, deleteMessage, banUser };
}
