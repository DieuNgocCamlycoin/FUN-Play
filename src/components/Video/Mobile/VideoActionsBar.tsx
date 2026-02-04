import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ExternalLink, Download, Loader2, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SaveToPlaylistDrawer } from "@/components/Playlist/SaveToPlaylistDrawer";

interface VideoActionsBarProps {
  channelId: string;
  channelName: string;
  channelAvatar?: string | null;
  subscriberCount: number;
  isSubscribed: boolean;
  onSubscribe: () => void;
  likeCount: number;
  hasLiked: boolean;
  onLike: () => void;
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
  onLike,
  onShare,
  videoUrl,
  videoTitle,
  videoId,
}: VideoActionsBarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveDrawerOpen, setSaveDrawerOpen] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}N`;
    return num.toString();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Fetch video blob
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      // Save to IndexedDB for offline access
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
    <div className="px-3 py-2 border-b border-border">
      {/* Channel row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar
          className="h-10 w-10 cursor-pointer"
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

        {/* Subscribe button */}
        <Button
          onClick={onSubscribe}
          size="sm"
          className={cn(
            "rounded-full px-4 h-9 font-semibold",
            isSubscribed
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-gradient-to-r from-cosmic-cyan to-cosmic-sapphire text-white hover:opacity-90 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          )}
        >
          {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
        </Button>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
        {/* Like/Dislike pill */}
        <div className="flex items-center bg-muted/80 rounded-full shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={cn(
              "rounded-full rounded-r-none gap-1.5 h-9 px-3",
              hasLiked && "text-cosmic-cyan"
            )}
          >
            <ThumbsUp className={cn("h-4 w-4", hasLiked && "fill-current")} />
            <span className="font-semibold text-sm">{formatNumber(likeCount)}</span>
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full rounded-l-none h-9 px-3"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="rounded-full bg-muted/80 h-9 px-3 shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        {/* Save to playlist */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSaveDrawerOpen(true)}
          className="rounded-full bg-muted/80 h-9 px-4 gap-1.5 shrink-0"
        >
          <Bookmark className="h-4 w-4" />
          <span className="text-sm">Lưu</span>
        </Button>

        {/* Download */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="rounded-full bg-muted/80 h-9 px-4 gap-1.5 shrink-0"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="text-sm">Tải xuống</span>
        </Button>
      </div>

      {/* Save to playlist drawer */}
      <SaveToPlaylistDrawer
        open={saveDrawerOpen}
        onOpenChange={setSaveDrawerOpen}
        videoId={videoId}
        videoTitle={videoTitle}
      />
    </div>
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
