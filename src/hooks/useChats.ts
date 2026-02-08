import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatItem {
  id: string;
  otherUser: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
}

export const useChats = () => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const { user } = useAuth();

  const fetchChats = useCallback(async () => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    try {
      // Get all chats where user is participant
      const { data: userChats, error } = await supabase
        .from("user_chats")
        .select(`
          id,
          user1_id,
          user2_id,
          updated_at
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (!userChats || userChats.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Get other user IDs
      const otherUserIds = userChats.map((chat: any) =>
        chat.user1_id === user.id ? chat.user2_id : chat.user1_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", otherUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Get last message for each chat
      const chatIds = userChats.map((c: any) => c.id);
      const { data: lastMessages } = await supabase
        .from("chat_messages")
        .select("chat_id, content, created_at")
        .in("chat_id", chatIds)
        .order("created_at", { ascending: false });

      // Group by chat_id to get last message
      const lastMessageMap = new Map<string, { content: string; created_at: string }>();
      lastMessages?.forEach((msg) => {
        if (!lastMessageMap.has(msg.chat_id)) {
          lastMessageMap.set(msg.chat_id, { content: msg.content || "", created_at: msg.created_at });
        }
      });

      // Count unread messages for each chat
      const { data: unreadCounts } = await supabase
        .from("chat_messages")
        .select("chat_id, id")
        .in("chat_id", chatIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      const unreadMap = new Map<string, number>();
      unreadCounts?.forEach((msg) => {
        unreadMap.set(msg.chat_id, (unreadMap.get(msg.chat_id) || 0) + 1);
      });

      const formattedChats: ChatItem[] = userChats.map((chat: any) => {
        const otherUserId =
          chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
        const otherProfile = profileMap.get(otherUserId);
        const lastMsg = lastMessageMap.get(chat.id);

        return {
          id: chat.id,
          otherUser: {
            id: otherUserId,
            username: otherProfile?.username || "Người dùng",
            display_name: otherProfile?.display_name,
            avatar_url: otherProfile?.avatar_url,
          },
          lastMessage: lastMsg?.content?.substring(0, 50) || null,
          lastMessageAt: new Date(lastMsg?.created_at || chat.updated_at),
          unreadCount: unreadMap.get(chat.id) || 0,
        };
      });

      // Sort by lastMessageAt
      formattedChats.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      setChats(formattedChats);
      setTotalUnread(
        formattedChats.reduce((sum, chat) => sum + chat.unreadCount, 0)
      );
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const findOrCreateChat = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!user?.id || user.id === otherUserId) return null;

      try {
        // Check existing chat
        const { data: existingChat } = await supabase
          .from("user_chats")
          .select("id")
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
          )
          .single();

        if (existingChat) {
          return existingChat.id;
        }

        // Create new chat
        const { data: newChat, error } = await supabase
          .from("user_chats")
          .insert({
            user1_id: user.id,
            user2_id: otherUserId,
          })
          .select("id")
          .single();

        if (error) throw error;

        // Refresh chats list
        fetchChats();

        return newChat?.id || null;
      } catch (error) {
        console.error("Error creating chat:", error);
        return null;
      }
    },
    [user?.id, fetchChats]
  );

  // Initial fetch
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Realtime subscription for chat updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("my-chats-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_chats",
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check if this chat involves current user
          if (
            newData?.user1_id === user.id ||
            newData?.user2_id === user.id ||
            oldData?.user1_id === user.id ||
            oldData?.user2_id === user.id
          ) {
            fetchChats();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        () => {
          // Refresh to update unread counts and last message
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchChats]);

  return {
    chats,
    loading,
    totalUnread,
    fetchChats,
    findOrCreateChat,
  };
};
