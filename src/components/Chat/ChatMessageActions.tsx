import { useRef, useCallback } from "react";
import { Reply, Pin, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = [
  { emoji: "🙏", label: "Biết ơn" },
  { emoji: "🥰", label: "Thương thương" },
  { emoji: "❤️", label: "Tim" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😮", label: "Wow" },
  { emoji: "🎉", label: "Pháo hoa" },
];

interface ChatMessageActionsProps {
  onReact: (emoji: string) => void;
  onReply: () => void;
  onPin?: () => void;
  onCopy?: () => void;
  isPinned?: boolean;
  isMe: boolean;
}

export const ChatMessageActions = ({
  onReact,
  onReply,
  onPin,
  onCopy,
  isPinned,
  isMe,
}: ChatMessageActionsProps) => {
  return (
    <div
      className={cn(
        "flex flex-col bg-background/95 backdrop-blur border rounded-2xl shadow-xl overflow-hidden min-w-[180px]",
      )}
    >
      {/* Thanh Reaction ngang */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b">
        {REACTION_EMOJIS.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            title={label}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-all text-lg hover:scale-125 active:scale-95 duration-150"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Menu hành động dọc */}
      <div className="flex flex-col py-1">
        <button
          onClick={onReply}
          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
        >
          <Reply className="h-4 w-4 text-muted-foreground" />
          <span>Trả lời</span>
        </button>

        {onPin && (
          <button
            onClick={onPin}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
          >
            <Pin className="h-4 w-4 text-muted-foreground" />
            <span>{isPinned ? "Bỏ ghim" : "Ghim"}</span>
          </button>
        )}

        {onCopy && (
          <button
            onClick={onCopy}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
            <span>Sao chép</span>
          </button>
        )}
      </div>
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
