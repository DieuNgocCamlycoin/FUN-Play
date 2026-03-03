import { useState, useCallback, useEffect, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatDonationCard } from "./ChatDonationCard";
import { ChatMessageActions, useLongPress } from "./ChatMessageActions";
import { ChatMessageReactions } from "./ChatMessageReactions";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Reply, Pin } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface ChatMessageItemProps {
  message: ChatMessage;
  isMe: boolean;
  showAvatar?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: ChatMessage) => void;
  onPin?: (messageId: string) => void;
}

const formatMessageTime = (date: Date) => {
  if (isToday(date)) {
    return format(date, "HH:mm");
  } else if (isYesterday(date)) {
    return `Hôm qua ${format(date, "HH:mm")}`;
  } else {
    return format(date, "dd/MM HH:mm", { locale: vi });
  }
};

export const ChatMessageItem = ({
  message,
  isMe,
  showAvatar = true,
  onReact,
  onReply,
  onPin,
}: ChatMessageItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const handleReact = useCallback(
    (emoji: string) => {
      onReact?.(message.id, emoji);
      setShowActions(false);
    },
    [message.id, onReact]
  );

  const handleReply = useCallback(() => {
    onReply?.(message);
    setShowActions(false);
  }, [message, onReply]);

  const handlePin = useCallback(() => {
    onPin?.(message.id);
    setShowActions(false);
  }, [message.id, onPin]);

  const handleCopy = useCallback(() => {
    if (message.content) {
      // Nếu là image, parse ra text
      let textToCopy = message.content;
      try {
        const parsed = JSON.parse(message.content);
        if (parsed.text) textToCopy = parsed.text;
      } catch {}
      navigator.clipboard.writeText(textToCopy);
      toast.success("Đã sao chép");
    }
    setShowActions(false);
  }, [message.content]);

  const longPressHandlers = useLongPress(() => setShowActions(true), 400);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    if (!showActions) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showActions]);

  // Right-click mở context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowActions(true);
  }, []);

  // System message
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const isDonation = message.messageType === "donation";

  // Check if message is emoji-only (sticker)
  const isEmojiOnly = (text: string | null) => {
    if (!text) return false;
    const emojiRegex =
      /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\u20E3]{1,6}$/u;
    return emojiRegex.test(text.trim());
  };

  const isSticker =
    message.messageType === "text" && isEmojiOnly(message.content);

  // Parse image message content
  const parseImageContent = () => {
    if (message.messageType !== "image") return null;
    try {
      const parsed = JSON.parse(message.content || "{}");
      return { text: parsed.text || "", imageUrl: parsed.imageUrl || "" };
    } catch {
      return null;
    }
  };

  const imageData = parseImageContent();

  // Truncate reply content
  const truncate = (s: string | null, max = 60) => {
    if (!s) return "";
    try {
      const parsed = JSON.parse(s);
      if (parsed.imageUrl) return "📷 Hình ảnh";
    } catch {}
    return s.length > max ? s.slice(0, max) + "…" : s;
  };

  return (
    <>
      {/* Backdrop mờ khi menu mở */}
      {showActions && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      )}

      <div
        className={cn(
          "flex gap-2 my-1 group relative",
          isMe ? "flex-row-reverse" : "flex-row",
          showActions && "z-50 relative"
        )}
        onContextMenu={handleContextMenu}
        {...longPressHandlers}
      >
        {/* Avatar */}
        {showAvatar && !isMe && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.sender?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-pink-400 text-white">
              {message.sender?.display_name?.[0] ||
                message.sender?.username?.[0] ||
                "?"}
            </AvatarFallback>
          </Avatar>
        )}
        {showAvatar && !isMe && <div className="w-8" />}

        <div
          className={cn("flex flex-col max-w-[85%]", isMe ? "items-end" : "items-start")}
        >
          {/* Reply preview */}
          {message.replyToId && (
            <div
              className={cn(
                "flex items-center gap-1.5 mb-0.5 px-3 py-1 rounded-lg text-xs max-w-[280px] truncate",
                "bg-muted/60 border-l-2 border-purple-400"
              )}
            >
              <Reply className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-purple-600 dark:text-purple-300 flex-shrink-0">
                {message.replyToSenderName || "..."}
              </span>
              <span className="text-muted-foreground truncate">
                {truncate(message.replyToContent)}
              </span>
            </div>
          )}

          {/* Bubble */}
          {isDonation ? (
            <ChatDonationCard
              content={message.content}
              deepLink={message.deepLink}
              donationTransactionId={message.donationTransactionId}
              isMe={isMe}
            />
          ) : isSticker ? (
            <div className="text-5xl py-1">{message.content}</div>
          ) : (
            <div
              className={cn(
                "max-w-[280px] break-words",
                imageData
                  ? "rounded-2xl overflow-hidden"
                  : "px-4 py-2.5",
                isMe
                  ? imageData
                    ? "rounded-br-sm"
                    : "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white rounded-2xl rounded-br-sm"
                  : imageData
                    ? "rounded-bl-sm"
                    : "bg-muted text-foreground rounded-2xl rounded-bl-sm",
                !imageData && message.isPending && "opacity-70",
                message.isError && "border-2 border-destructive"
              )}
            >
              {imageData ? (
                <div
                  className={cn(
                    "border rounded-2xl overflow-hidden",
                    isMe ? "rounded-br-sm" : "rounded-bl-sm",
                    message.isPending && "opacity-70"
                  )}
                >
                  <img
                    src={imageData.imageUrl}
                    alt="Hình ảnh"
                    className="w-full max-h-60 object-cover cursor-pointer"
                    onClick={() => window.open(imageData.imageUrl, "_blank")}
                  />
                  {imageData.text && (
                    <div
                      className={cn(
                        "px-3 py-2 text-sm",
                        isMe
                          ? "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{imageData.text}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          )}

          {/* Reactions */}
          <ChatMessageReactions
            reactions={message.reactions || []}
            onToggleReaction={(emoji) => onReact?.(message.id, emoji)}
            isMe={isMe}
          />

          {/* Time + status + pin icon */}
          <div
            className={cn(
              "flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground",
              isMe ? "mr-1" : "ml-1"
            )}
          >
            {message.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            {message.isError && (
              <AlertCircle className="w-3 h-3 text-destructive" />
            )}
            {message.isPinned && (
              <Pin className="w-3 h-3 text-amber-500" />
            )}
            <span>{formatMessageTime(message.createdAt)}</span>
          </div>
        </div>

        {/* Context menu */}
        {showActions && !message.isPending && !message.isError && (
          <div
            ref={actionsRef}
            className={cn(
              "absolute z-50",
              isMe ? "right-0 -top-12" : "left-10 -top-12"
            )}
          >
            <ChatMessageActions
              onReact={handleReact}
              onReply={handleReply}
              onPin={onPin ? handlePin : undefined}
              onCopy={handleCopy}
              isPinned={message.isPinned}
              isMe={isMe}
            />
          </div>
        )}
      </div>
    </>
  );
};
