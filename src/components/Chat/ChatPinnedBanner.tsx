import { useState } from "react";
import { Pin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface ChatPinnedBannerProps {
  pinnedMessage: ChatMessage;
  onScrollToMessage?: (messageId: string) => void;
}

export const ChatPinnedBanner = ({
  pinnedMessage,
  onScrollToMessage,
}: ChatPinnedBannerProps) => {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  // Rút gọn nội dung
  let preview = pinnedMessage.content || "";
  try {
    const parsed = JSON.parse(preview);
    if (parsed.imageUrl) preview = "📷 Hình ảnh";
    else if (parsed.text) preview = parsed.text;
  } catch {}
  if (preview.length > 80) preview = preview.slice(0, 80) + "…";

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-amber-50/80 dark:bg-amber-900/20 border-b cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
      onClick={() => onScrollToMessage?.(pinnedMessage.id)}
    >
      <Pin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <span className="text-xs text-foreground truncate flex-1">
        {preview}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setHidden(true);
        }}
        className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
};
