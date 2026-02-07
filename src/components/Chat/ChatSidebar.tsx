import { useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ChatItem } from "@/hooks/useChats";

interface ChatSidebarProps {
  chats: ChatItem[];
  loading: boolean;
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  className?: string;
}

export const ChatSidebar = ({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  className,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.otherUser.display_name?.toLowerCase().includes(query) ||
      chat.otherUser.username.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className={cn(
        "flex flex-col bg-background/80 backdrop-blur-xl border-r border-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent mb-3">
          Tin nhắn
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-purple-300"
          />
        </div>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Không tìm thấy cuộc trò chuyện" : "Chưa có cuộc trò chuyện nào"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === selectedChatId}
                onClick={() => onSelectChat(chat.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

interface ChatListItemProps {
  chat: ChatItem;
  isActive: boolean;
  onClick: () => void;
}

const ChatListItem = ({ chat, isActive, onClick }: ChatListItemProps) => {
  const displayName = chat.otherUser.display_name || chat.otherUser.username;
  const timeAgo = formatDistanceToNow(chat.lastMessageAt, {
    addSuffix: false,
    locale: vi,
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50",
        isActive && [
          "bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-cyan-100/80",
          "ring-1 ring-purple-200/50",
          "shadow-sm",
        ]
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.otherUser.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-medium">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Unread badge */}
        {chat.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "font-medium truncate",
              chat.unreadCount > 0 && "font-semibold"
            )}
          >
            {displayName}
          </p>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">
            {timeAgo}
          </span>
        </div>
        <p
          className={cn(
            "text-sm truncate",
            chat.unreadCount > 0
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          )}
        >
          {chat.lastMessage || "Bắt đầu cuộc trò chuyện"}
        </p>
      </div>
    </button>
  );
};
