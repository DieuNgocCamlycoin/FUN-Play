import { useState, useRef, useCallback } from "react";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = [
  { emoji: "🙏", label: "Biết ơn" },
  { emoji: "🥰", label: "Thương thương" },
  { emoji: "❤️", label: "Tim" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😮", label: "Wow" },
  { emoji: "👍", label: "Like" },
];

interface ChatMessageActionsProps {
  onReact: (emoji: string) => void;
  onReply: () => void;
  isMe: boolean;
}

export const ChatMessageActions = ({
  onReact,
  onReply,
  isMe,
}: ChatMessageActionsProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 bg-background/95 backdrop-blur border rounded-full shadow-lg px-1.5 py-1",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
    >
      {REACTION_EMOJIS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          title={label}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-lg hover:scale-125 active:scale-95 transition-transform duration-150"
        >
          {emoji}
        </button>
      ))}
      <div className="w-px h-5 bg-border mx-0.5" />
      <button
        onClick={onReply}
        title="Trả lời"
        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Reply className="h-4 w-4" />
      </button>
    </div>
  );
};

// Hook for long-press detection
export const useLongPress = (callback: () => void, ms = 500) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};
