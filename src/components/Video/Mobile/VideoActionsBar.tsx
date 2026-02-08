import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Download, Loader2, Bookmark, Bell, BellRing, BellOff, ChevronDown, Share2, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SaveToPlaylistDrawer } from "@/components/Playlist/SaveToPlaylistDrawer";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoActionsBarProps {
  channelId: string;
  channelName: string;
  channelAvatar?: string | null;
  subscriberCount: number;
  isSubscribed: boolean;
  onSubscribe: () => void;
  likeCount: number;
  hasLiked: boolean;
  hasDisliked?: boolean;
  onLike: () => void;
  onDislike?: () => void;
  onShare: () => void;
  videoUrl: string;
  videoTitle: string;
  videoId: string;
}

export function VideoActionsBar({
  channelId,
  channelName,
  channelAvatar,
  subscriberCount,
  isSubscribed,
  onSubscribe,
  likeCount,
  hasLiked,
  hasDisliked = false,
  onLike,
  onDislike,
  onShare,
  videoUrl,
  videoTitle,
  videoId,
}: VideoActionsBarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveDrawerOpen, setSaveDrawerOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const { lightTap, successFeedback } = useHapticFeedback();
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}N`;
    return num.toString();
  };

  const handleLike = () => {
    successFeedback();
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 600);
    onLike();
  };

  const handleDownload = async () => {
    lightTap();
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      const db = await openOfflineDB();
      await saveVideoToDB(db, {
        id: videoId,
        title: videoTitle,
        blob,
        downloadedAt: new Date().toISOString(),
      });

      toast({
        title: "Đã tải xuống",
        description: "Video đã được lưu để xem offline",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Lỗi tải xuống",
        description: "Không thể tải video. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="px-3 py-3 border-b border-border">
        {/* Channel row */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar
            className="h-10 w-10 cursor-pointer ring-2 ring-transparent hover:ring-cosmic-cyan/30 transition-all"
            onClick={() => navigate(`/channel/${channelId}`)}
          >
            <AvatarImage src={channelAvatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-cosmic-sapphire to-cosmic-cyan text-white font-semibold">
              {channelName[0]}
            </AvatarFallback>
          </Avatar>

          {/* Channel info */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(`/channel/${channelId}`)}
          >
            <p className="text-sm font-semibold text-foreground truncate">
              {channelName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(subscriberCount)} người đăng ký
            </p>
          </div>

          {/* Subscribe/Bell button - Logic mới */}
          {isSubscribed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => lightTap()}
                  className="rounded-full h-9 px-3 bg-muted shrink-0 hover:bg-muted/80"
                >
                  <Bell className="h-5 w-5" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-xl">
                <DropdownMenuItem className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  Tất cả thông báo
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <BellRing className="mr-2 h-4 w-4" />
                  Cá nhân hóa
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <BellOff className="mr-2 h-4 w-4" />
                  Không nhận
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => { lightTap(); onSubscribe(); }}
                  className="text-destructive cursor-pointer focus:text-destructive"
                >
                  Hủy đăng ký
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => { lightTap(); onSubscribe(); }}
              size="sm"
              className={cn(
                "rounded-full px-4 h-9 font-semibold shrink-0 transition-all duration-300",
                "bg-gradient-to-r from-cosmic-cyan to-cosmic-sapphire text-white",
                "hover:opacity-90 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
              )}
            >
              Đăng ký
            </Button>
          )}
        </div>

        {/* Actions row - ENHANCED - Tăng padding right để không bị cắt */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto overflow-y-visible pb-1 pr-6 scrollbar-hide">
          {/* Like/Dislike pill - ENHANCED */}
          <div className="flex items-center bg-muted/80 rounded-full shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={cn(
                      "rounded-full rounded-r-none gap-1.5 h-10 px-4 transition-all duration-300",
                      hasLiked && "text-cosmic-cyan bg-gradient-to-r from-cyan-500/10 to-purple-500/10",
                      showLikeAnimation && "animate-rainbow-sparkle"
                    )}
                  >
                    <ThumbsUp className={cn(
                      "h-5 w-5 transition-all duration-200", 
                      hasLiked && "fill-current scale-110"
                    )} />
                    <span className="font-semibold">{formatNumber(likeCount)}</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{hasLiked ? "Đã thích! 💖" : "Lan tỏa ánh sáng! ✨"}</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-border" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { lightTap(); onDislike?.(); }}
              className={cn(
                "rounded-full rounded-l-none h-10 px-4 hover:bg-muted",
                hasDisliked && "text-cosmic-magenta"
              )}
            >
              <ThumbsDown className={cn("h-5 w-5", hasDisliked && "fill-current")} />
            </Button>
          </div>

          {/* Share button - Icon only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { lightTap(); onShare(); }}
            className="rounded-full bg-muted/80 h-10 w-10 shrink-0 hover:bg-muted"
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {/* Donate button - Premium Gold with Mirror Shimmer */}
          <Button
            onClick={() => { lightTap(); setDonateModalOpen(true); }}
            className="relative overflow-hidden rounded-full bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] 
                       text-[#7C5800] font-bold h-10 px-4 gap-1.5 shrink-0
                       shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]
                       hover:shadow-[0_0_25px_rgba(255,234,0,0.7)] 
                       border border-[#FFEA00]/60 transition-all duration-300"
          >
            <Gift className="h-5 w-5 relative z-10" />
            <span className="text-sm font-bold relative z-10">Tặng</span>
            {/* Mirror shimmer effect - continuous */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
          </Button>

          {/* Save to playlist - với icon và text */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { lightTap(); setSaveDrawerOpen(true); }}
                className="rounded-full bg-muted/80 h-10 px-4 gap-1.5 shrink-0 hover:bg-primary/10"
              >
                <Bookmark className="h-5 w-5" />
                <span className="text-sm font-medium">Lưu</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lưu vào danh sách phát 📚</p>
            </TooltipContent>
          </Tooltip>

          {/* Download - với status và margin-right để không bị cắt */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="rounded-full bg-muted/80 h-10 px-4 gap-1.5 shrink-0 hover:bg-muted mr-2"
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">Tải xuống</span>
          </Button>
        </div>

        {/* Save to playlist drawer */}
        <SaveToPlaylistDrawer
          open={saveDrawerOpen}
          onOpenChange={setSaveDrawerOpen}
          videoId={videoId}
          videoTitle={videoTitle}
        />

        {/* Donate modal */}
        <EnhancedDonateModal
          open={donateModalOpen}
          onOpenChange={setDonateModalOpen}
          defaultReceiverId={channelId}
          defaultReceiverName={channelName}
        />
      </div>
    </TooltipProvider>
  );
}

// IndexedDB helpers for offline video storage
const DB_NAME = "FunPlayOfflineVideos";
const DB_VERSION = 1;
const STORE_NAME = "videos";

interface OfflineVideo {
  id: string;
  title: string;
  blob: Blob;
  downloadedAt: string;
}

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function saveVideoToDB(db: IDBDatabase, video: OfflineVideo): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(video);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
