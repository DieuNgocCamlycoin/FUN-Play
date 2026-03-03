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
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  replyToId?: string | null;
  replyToContent?: string | null;
  replyToSenderName?: string | null;
  reactions?: { emoji: string; count: number; hasMyReaction: boolean }[];
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

  const fetchReactions = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return new Map<string, ChatMessage["reactions"]>();
    
    const { data } = await supabase
      .from("chat_message_reactions")
      .select("message_id, emoji, user_id")
      .in("message_id", messageIds);

    const reactionMap = new Map<string, ChatMessage["reactions"]>();
    if (!data) return reactionMap;

    // Group by message_id
    const grouped = new Map<string, { emoji: string; user_id: string }[]>();
    for (const r of data) {
      const existing = grouped.get(r.message_id) || [];
      existing.push({ emoji: r.emoji, user_id: r.user_id });
      grouped.set(r.message_id, existing);
    }

    for (const [msgId, reactions] of grouped) {
      const emojiMap = new Map<string, { count: number; hasMyReaction: boolean }>();
      for (const r of reactions) {
        const existing = emojiMap.get(r.emoji) || { count: 0, hasMyReaction: false };
        existing.count++;
        if (r.user_id === user?.id) existing.hasMyReaction = true;
        emojiMap.set(r.emoji, existing);
      }
      reactionMap.set(
        msgId,
        Array.from(emojiMap.entries()).map(([emoji, data]) => ({
          emoji,
          ...data,
        }))
      );
    }

    return reactionMap;
  }, [user?.id]);

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
          is_read,
          reply_to_id,
          is_pinned,
          pinned_at,
          pinned_by
        `)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get unique sender IDs
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];

      // Fetch sender profiles and reactions in parallel
      const [{ data: profiles }, reactionMap] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", senderIds),
        fetchReactions(data?.map((m) => m.id) || []),
      ]);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Build reply info map
      const replyToIds = data?.filter((m) => m.reply_to_id).map((m) => m.reply_to_id!) || [];
      const replyInfoMap = new Map<string, { content: string | null; senderName: string | null }>();
      
      if (replyToIds.length > 0) {
        // Look up reply targets from within the same data set first
        const dataMap = new Map(data?.map((m) => [m.id, m]) || []);
        for (const rid of replyToIds) {
          const target = dataMap.get(rid);
          if (target) {
            const senderProfile = profileMap.get(target.sender_id);
            replyInfoMap.set(rid, {
              content: target.content,
              senderName: senderProfile?.display_name || senderProfile?.username || null,
            });
          }
        }

        // Fetch any missing reply targets
        const missing = replyToIds.filter((id) => !replyInfoMap.has(id));
        if (missing.length > 0) {
          const { data: replyMsgs } = await supabase
            .from("chat_messages")
            .select("id, content, sender_id")
            .in("id", missing);
          
          if (replyMsgs) {
            const replySenderIds = [...new Set(replyMsgs.map((m) => m.sender_id))];
            const { data: replyProfiles } = await supabase
              .from("profiles")
              .select("id, username, display_name")
              .in("id", replySenderIds);
            const replyProfileMap = new Map(replyProfiles?.map((p) => [p.id, p]) || []);
            
            for (const rm of replyMsgs) {
              const sp = replyProfileMap.get(rm.sender_id);
              replyInfoMap.set(rm.id, {
                content: rm.content,
                senderName: sp?.display_name || sp?.username || null,
              });
            }
          }
        }
      }

      const formattedMessages: ChatMessage[] = (data || []).map((msg) => {
        const replyInfo = msg.reply_to_id ? replyInfoMap.get(msg.reply_to_id) : null;
        return {
          id: msg.id,
          chatId: msg.chat_id,
          senderId: msg.sender_id,
          messageType: msg.message_type as ChatMessage["messageType"],
          content: msg.content,
          donationTransactionId: msg.donation_transaction_id,
          deepLink: msg.deep_link,
          createdAt: new Date(msg.created_at),
          isRead: msg.is_read,
          isPinned: (msg as any).is_pinned || false,
          pinnedAt: (msg as any).pinned_at || null,
          pinnedBy: (msg as any).pinned_by || null,
          sender: profileMap.get(msg.sender_id),
          replyToId: msg.reply_to_id,
          replyToContent: replyInfo?.content || null,
          replyToSenderName: replyInfo?.senderName || null,
          reactions: reactionMap.get(msg.id) || [],
        };
      });

      setMessages(formattedMessages);
      markAsRead();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId, user?.id, fetchReactions]);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string, replyToId?: string): Promise<boolean> => {
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
        replyToId: replyToId || null,
        reactions: [],
        sender: {
          id: user.id,
          username: "",
          display_name: null,
          avatar_url: null,
        },
      };

      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      try {
        const insertData: any = {
          chat_id: chatId,
          sender_id: user.id,
          message_type: messageType,
          content: finalContent,
        };
        if (replyToId) insertData.reply_to_id = replyToId;

        const { data, error } = await supabase
          .from("chat_messages")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: data.id, isPending: false }
              : msg
          )
        );

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, isPending: false, isError: true }
              : msg
          )
        );
        return false;
      }
    },
    [chatId, user?.id, scrollToBottom]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user?.id) return;

      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = [...(msg.reactions || [])];
          const idx = reactions.findIndex((r) => r.emoji === emoji);
          if (idx >= 0) {
            if (reactions[idx].hasMyReaction) {
              reactions[idx] = { ...reactions[idx], count: reactions[idx].count - 1, hasMyReaction: false };
              if (reactions[idx].count <= 0) reactions.splice(idx, 1);
            } else {
              reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1, hasMyReaction: true };
            }
          } else {
            reactions.push({ emoji, count: 1, hasMyReaction: true });
          }
          return { ...msg, reactions };
        })
      );

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("chat_message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("chat_message_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("chat_message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });
      }
    },
    [user?.id]
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

  // Realtime subscription for messages
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
          if (newMsg.sender_id === user?.id) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          // Resolve reply info
          let replyToContent: string | null = null;
          let replyToSenderName: string | null = null;
          if (newMsg.reply_to_id) {
            const existingMsg = messages.find((m) => m.id === newMsg.reply_to_id);
            if (existingMsg) {
              replyToContent = existingMsg.content;
              replyToSenderName = existingMsg.sender?.display_name || existingMsg.sender?.username || null;
            }
          }

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
            replyToId: newMsg.reply_to_id,
            replyToContent,
            replyToSenderName,
            reactions: [],
          };

          setMessages((prev) => [...prev, formattedMessage]);
          scrollToBottom();
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id, scrollToBottom, markAsRead]);

  // Realtime subscription for reactions
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-reactions-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_message_reactions",
        },
        (payload) => {
          const record = (payload.new || payload.old) as any;
          if (!record?.message_id) return;

          // Re-fetch reactions for this message
          supabase
            .from("chat_message_reactions")
            .select("emoji, user_id")
            .eq("message_id", record.message_id)
            .then(({ data }) => {
              if (!data) return;
              const emojiMap = new Map<string, { count: number; hasMyReaction: boolean }>();
              for (const r of data) {
                const existing = emojiMap.get(r.emoji) || { count: 0, hasMyReaction: false };
                existing.count++;
                if (r.user_id === user?.id) existing.hasMyReaction = true;
                emojiMap.set(r.emoji, existing);
              }
              const reactions = Array.from(emojiMap.entries()).map(([emoji, d]) => ({ emoji, ...d }));

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === record.message_id ? { ...msg, reactions } : msg
                )
              );
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id]);

  const togglePinMessage = useCallback(
    async (messageId: string) => {
      if (!user?.id) return;

      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      const newPinned = !msg.isPinned;

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isPinned: newPinned, pinnedAt: newPinned ? new Date().toISOString() : null, pinnedBy: newPinned ? user.id : null }
            : m
        )
      );

      await supabase
        .from("chat_messages")
        .update({
          is_pinned: newPinned,
          pinned_at: newPinned ? new Date().toISOString() : null,
          pinned_by: newPinned ? user.id : null,
        } as any)
        .eq("id", messageId);
    },
    [user?.id, messages]
  );

  // Tin nhắn ghim mới nhất
  const pinnedMessage = messages
    .filter((m) => m.isPinned)
    .sort((a, b) => {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    })[0] || null;

  return {
    messages,
    loading,
    sendMessage,
    toggleReaction,
    togglePinMessage,
    pinnedMessage,
    markAsRead,
    messagesEndRef,
    scrollToBottom,
  };
};
