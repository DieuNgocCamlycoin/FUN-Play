import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => Promise<boolean>;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    const content = message.trim();
    setMessage("");

    await onSend(content);
    setSending(false);

    // Focus back to input
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur p-3">
      <div className="flex items-end gap-2">
        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhắn tin yêu thương..."
            disabled={disabled || sending}
            rows={1}
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              "bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-purple-300",
              "rounded-2xl py-3 px-4"
            )}
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className={cn(
            "h-11 w-11 rounded-full flex-shrink-0",
            "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600",
            "hover:from-purple-600 hover:via-pink-600 hover:to-purple-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
            "transition-all duration-200"
          )}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : message.trim() ? (
            <Send className="h-5 w-5" />
          ) : (
            <Heart className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Hint */}
      <p className="text-[10px] text-muted-foreground mt-1.5 ml-2">
        Enter để gửi • Shift+Enter xuống dòng
      </p>
    </div>
  );
};
