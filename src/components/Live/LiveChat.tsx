import { useState, useRef, useEffect } from "react";
import { useLiveChat, LiveChatMessage } from "@/hooks/useLiveChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Gift } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface LiveChatProps {
  livestreamId: string;
  className?: string;
}

export const LiveChat = ({ livestreamId, className }: LiveChatProps) => {
  const { messages, isLoading, sendMessage } = useLiveChat(livestreamId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
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
            <ChatBubble key={msg.id} message={msg} />
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

function ChatBubble({ message }: { message: LiveChatMessage }) {
  const isDonation = message.message_type === "donation";

  return (
    <div
      className={cn(
        "flex items-start gap-2 text-sm",
        isDonation && "bg-amber-500/10 rounded-lg p-1.5"
      )}
    >
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={message.profile?.avatar_url || ""} />
        <AvatarFallback className="text-[10px]">
          {(message.profile?.display_name || "U")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <span className="font-medium text-xs text-primary">
          {message.profile?.display_name || message.profile?.username || "Ẩn danh"}
        </span>
        {isDonation && <Gift className="inline h-3 w-3 text-amber-500 ml-1" />}
        <span className="text-muted-foreground ml-1.5 break-words">
          {message.content}
        </span>
      </div>
    </div>
  );
}
