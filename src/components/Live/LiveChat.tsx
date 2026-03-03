import { useState, useRef, useEffect } from "react";
import { useLiveChat, LiveChatMessage } from "@/hooks/useLiveChat";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Gift, Trash2, Ban } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LiveChatProps {
  livestreamId: string;
  streamerId?: string;
  className?: string;
}

export const LiveChat = ({ livestreamId, streamerId, className }: LiveChatProps) => {
  const { messages, isLoading, sendMessage, deleteMessage, banUser } = useLiveChat(livestreamId);
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamer = user?.id === streamerId;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await sendMessage(text);
    } catch (err: any) {
      toast.error(err?.message || "Không thể gửi tin nhắn");
    }
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
    toast.success("Đã xoá tin nhắn");
  };

  const handleBan = async (userId: string) => {
    await banUser(userId);
    toast.success("Đã cấm người dùng khỏi chat");
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border border-border rounded-xl", className)}>
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold">Trò chuyện trực tiếp</h3>
      </div>

      <ScrollArea className="flex-1 px-3" ref={scrollRef}>
        <div className="space-y-2 py-2">
          {isLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">Đang tải...</p>
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isStreamer={isStreamer}
              currentUserId={user?.id}
              onDelete={handleDelete}
              onBan={handleBan}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhắn gì đó..."
          className="text-sm h-9"
        />
        <Button size="sm" onClick={handleSend} disabled={!input.trim()} className="h-9 px-3">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

function ChatBubble({
  message,
  isStreamer,
  currentUserId,
  onDelete,
  onBan,
}: {
  message: LiveChatMessage;
  isStreamer: boolean;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onBan: (userId: string) => void;
}) {
  const isDonation = message.message_type === "donation";
  const canModerate = isStreamer && message.user_id !== currentUserId;

  return (
    <div
      className={cn(
        "group flex items-start gap-2 text-sm",
        isDonation && "bg-amber-500/10 rounded-lg p-1.5"
      )}
    >
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={message.profile?.avatar_url || ""} />
        <AvatarFallback className="text-[10px]">
          {(message.profile?.display_name || "U")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <span className="font-medium text-xs text-primary">
          {message.profile?.display_name || message.profile?.username || "Ẩn danh"}
        </span>
        {isDonation && <Gift className="inline h-3 w-3 text-amber-500 ml-1" />}
        <span className="text-muted-foreground ml-1.5 break-words">
          {message.content}
        </span>
      </div>
      {canModerate && (
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(message.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={() => onBan(message.user_id)}
          >
            <Ban className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
