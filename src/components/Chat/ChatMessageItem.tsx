import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatDonationCard } from "./ChatDonationCard";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChatMessages";

interface ChatMessageItemProps {
  message: ChatMessage;
  isMe: boolean;
  showAvatar?: boolean;
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
}: ChatMessageItemProps) => {
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

  // Donation message
  if (message.messageType === "donation") {
    return (
      <div className="my-3 px-1 sm:px-0">
      <ChatDonationCard
          content={message.content}
          deepLink={message.deepLink}
          donationTransactionId={message.donationTransactionId}
          isMe={isMe}
        />
        <div
          className={cn(
            "text-[10px] text-muted-foreground mt-1",
            isMe ? "text-right mr-2" : "ml-2"
          )}
        >
          {formatMessageTime(message.createdAt)}
        </div>
      </div>
    );
  }

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

  // Text or image message
  return (
    <div
      className={cn(
        "flex gap-2 my-1",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
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

      <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "max-w-[280px] break-words",
            imageData ? "rounded-2xl overflow-hidden" : "px-4 py-2.5",
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
            <div className={cn(
              "border rounded-2xl overflow-hidden",
              isMe ? "rounded-br-sm" : "rounded-bl-sm",
              message.isPending && "opacity-70"
            )}>
              <img
                src={imageData.imageUrl}
                alt="Hình ảnh"
                className="w-full max-h-60 object-cover cursor-pointer"
                onClick={() => window.open(imageData.imageUrl, "_blank")}
              />
              {imageData.text && (
                <div className={cn(
                  "px-3 py-2 text-sm",
                  isMe
                    ? "bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white"
                    : "bg-muted text-foreground"
                )}>
                  <p className="whitespace-pre-wrap">{imageData.text}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Time + status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground",
            isMe ? "mr-1" : "ml-1"
          )}
        >
          {message.isPending && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {message.isError && (
            <AlertCircle className="w-3 h-3 text-destructive" />
          )}
          <span>{formatMessageTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
