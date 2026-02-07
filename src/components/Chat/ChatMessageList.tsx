import { useEffect, useRef } from "react";
import { ChatMessageItem } from "./ChatMessageItem";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface ChatMessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessageList = ({
  messages,
  loading,
  currentUserId,
  messagesEndRef,
}: ChatMessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, messagesEndRef]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`flex gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton
              className={`h-12 ${
                i % 2 === 0 ? "w-48" : "w-40"
              } rounded-2xl`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-muted-foreground text-sm">
            Chưa có tin nhắn nào
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hãy gửi lời chào đầu tiên! 💖
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
    >
      {messages.map((message, index) => {
        const isMe = message.senderId === currentUserId;
        const prevMessage = messages[index - 1];
        const showAvatar =
          !prevMessage ||
          prevMessage.senderId !== message.senderId ||
          message.createdAt.getTime() - prevMessage.createdAt.getTime() >
            5 * 60 * 1000; // 5 minutes gap

        return (
          <ChatMessageItem
            key={message.id}
            message={message}
            isMe={isMe}
            showAvatar={showAvatar}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
