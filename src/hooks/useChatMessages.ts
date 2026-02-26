import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  messageType: "text" | "donation" | "system" | "image";
  content: string | null;
  donationTransactionId: string | null;
  deepLink: string | null;
  createdAt: Date;
  isRead: boolean;
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  // For optimistic UI
  isPending?: boolean;
  isError?: boolean;
}

export const useChatMessages = (chatId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!chatId || !user?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          id,
          chat_id,
          sender_id,
          message_type,
          content,
          donation_transaction_id,
          deep_link,
          created_at,
          is_read
        `)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get unique sender IDs
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];

      // Fetch sender profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const formattedMessages: ChatMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        messageType: msg.message_type as "text" | "donation" | "system" | "image",
        content: msg.content,
        donationTransactionId: msg.donation_transaction_id,
        deepLink: msg.deep_link,
        createdAt: new Date(msg.created_at),
        isRead: msg.is_read,
        sender: profileMap.get(msg.sender_id),
      }));

      setMessages(formattedMessages);
      
      // Mark messages as read after fetching
      markAsRead();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId, user?.id]);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string): Promise<boolean> => {
      if (!chatId || !user?.id || (!content.trim() && !imageUrl)) return false;

      const messageType = imageUrl ? "image" : "text";
      const finalContent = imageUrl
        ? JSON.stringify({ text: content.trim(), imageUrl })
        : content.trim();

      const tempId = `temp-${Date.now()}`;
      const tempMessage: ChatMessage = {
        id: tempId,
        chatId,
        senderId: user.id,
        messageType: messageType as any,
        content: finalContent,
        donationTransactionId: null,
        deepLink: null,
        createdAt: new Date(),
        isRead: false,
        isPending: true,
        sender: {
          id: user.id,
          username: "",
          display_name: null,
          avatar_url: null,
        },
      };

      // Optimistic update
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .insert({
            chat_id: chatId,
            sender_id: user.id,
            message_type: messageType,
            content: finalContent,
          })
          .select()
          .single();

        if (error) throw error;

        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: data.id,
                  isPending: false,
                }
              : msg
          )
        );

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        // Mark as error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  isPending: false,
                  isError: true,
                }
              : msg
          )
        );
        return false;
      }
    },
    [chatId, user?.id, scrollToBottom]
  );

  const markAsRead = useCallback(async () => {
    if (!chatId || !user?.id) return;

    try {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [chatId, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Don't add if it's our own message (already added optimistically)
          if (newMsg.sender_id === user?.id) {
            return;
          }

          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          const formattedMessage: ChatMessage = {
            id: newMsg.id,
            chatId: newMsg.chat_id,
            senderId: newMsg.sender_id,
            messageType: newMsg.message_type,
            content: newMsg.content,
            donationTransactionId: newMsg.donation_transaction_id,
            deepLink: newMsg.deep_link,
            createdAt: new Date(newMsg.created_at),
            isRead: newMsg.is_read,
            sender: profile || undefined,
          };

          setMessages((prev) => [...prev, formattedMessage]);
          scrollToBottom();
          
          // Mark as read immediately since user is viewing
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id, scrollToBottom, markAsRead]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    messagesEndRef,
    scrollToBottom,
  };
};
