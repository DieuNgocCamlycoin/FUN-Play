import { useEffect, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatWindowProps {
  chatId: string;
  showBackButton?: boolean;
}

interface OtherUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const ChatWindow = ({ chatId, showBackButton = false }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, messagesEndRef } = useChatMessages(chatId);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch other user info
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!chatId || !user?.id) return;

      try {
        // Get chat info
        const { data: chat } = await supabase
          .from("user_chats")
          .select("user1_id, user2_id")
          .eq("id", chatId)
          .single();

        if (!chat) return;

        const otherUserId =
          chat.user1_id === user.id ? chat.user2_id : chat.user1_id;

        // Get other user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .eq("id", otherUserId)
          .single();

        if (profile) {
          setOtherUser(profile);
        }
      } catch (error) {
        console.error("Error fetching other user:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchOtherUser();
  }, [chatId, user?.id]);

  if (loadingUser || !otherUser) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-16 border-b flex items-center gap-3 px-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-40"} rounded-2xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-purple-50/30 via-transparent to-pink-50/30">
      <ChatHeader otherUser={otherUser} showBackButton={showBackButton} />
      
      <ChatMessageList
        messages={messages}
        loading={loading}
        currentUserId={user?.id || ""}
        messagesEndRef={messagesEndRef}
      />
      
      <ChatInput onSend={sendMessage} disabled={!user} />
    </div>
  );
};
