import { useState } from "react";
import { Play, Edit, Share2, ListPlus, MoreVertical, Clock, Flag, EyeOff, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareModal } from "./ShareModal";
import { AddToPlaylistModal } from "@/components/Playlist/AddToPlaylistModal";
import { WatchLaterButton } from "./WatchLaterButton";
import { LazyImage } from "@/components/ui/LazyImage";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useWatchLater } from "@/hooks/useWatchLater";
import { VideoPlaceholder } from "./VideoPlaceholder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoCardProps {
  thumbnail?: string;
  title?: string;
  channel?: string;
  views?: string;
  timestamp?: string;
  videoId?: string;
  userId?: string;
  channelId?: string;
  avatarUrl?: string;
  duration?: number | null;
  isVerified?: boolean;
  onPlay?: (videoId: string) => void;
  isLoading?: boolean;
}

// Format seconds to MM:SS or HH:MM:SS
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const VideoCard = ({
  thumbnail,
  title,
  channel,
  views,
  timestamp,
  videoId,
  userId,
  channelId,
  avatarUrl,
  duration,
  isVerified,
  onPlay,
  isLoading = false,
}: VideoCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { lightTap } = useHapticFeedback();
  const { toggleWatchLater } = useWatchLater();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const isOwner = user?.id === userId;

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="overflow-hidden glass-card border-2 border-white/10">
        <Skeleton className="aspect-video w-full" />
        <div className="p-4 flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  const handlePlay = () => {
    lightTap();
    if (onPlay && videoId) {
      onPlay(videoId);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    navigate(`/studio?tab=content&edit=${videoId}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    setShareModalOpen(true);
  };

  const handleAddToPlaylist = () => {
    lightTap();
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thêm video vào danh sách phát",
        variant: "destructive",
      });
      return;
    }
    setPlaylistModalOpen(true);
  };

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (channelId) {
      navigate(`/channel/${channelId}`);
    }
  };

  const handleNotInterested = () => {
    lightTap();
    toast({
      title: "Đã ẩn video",
      description: "Video này sẽ không hiển thị nữa",
    });
  };

  const durationStr = formatDuration(duration);

  return (
    <Card className="group overflow-hidden bg-white/95 dark:bg-white/90 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 transition-all duration-500 cursor-pointer relative shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg" onClick={handlePlay}>
        {thumbnail ? (
          <LazyImage
            src={thumbnail}
            alt={title || 'Video thumbnail'}
            aspectRatio="video"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <VideoPlaceholder className="group-hover:scale-110 transition-transform duration-700" />
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta divine-glow border-2 border-glow-cyan shadow-[0_0_60px_rgba(0,255,255,1)]"
          >
            <Play className="h-8 w-8 fill-current text-foreground" />
          </Button>
        </div>

        {/* Duration badge - YouTube style */}
        {durationStr && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {durationStr}
          </span>
        )}

        {/* Edit button for owner */}
        {isOwner && (
          <Button
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 bg-cosmic-magenta/90 hover:bg-cosmic-magenta border border-glow-magenta text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_35px_rgba(217,0,255,0.9)]"
            onClick={handleEdit}
            title="Chỉnh sửa trong Studio"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Watch Later button */}
        {videoId && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <WatchLaterButton videoId={videoId} />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 flex gap-2 bg-white/80">
        <div className="flex-shrink-0" onClick={handleChannelClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channel}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-foreground font-bold text-xs shadow-[0_0_20px_rgba(0,255,255,0.5)] cursor-pointer hover:scale-110 transition-transform">
              {channel?.[0] || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-gray-900 group-hover:text-cosmic-cyan transition-colors duration-300">
            {title}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <p 
              className="text-xs text-gray-600 group-hover:text-divine-rose-gold transition-colors duration-300 cursor-pointer hover:underline truncate"
              onClick={handleChannelClick}
            >
              {channel}
            </p>
            {isVerified && (
              <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-cosmic-magenta transition-colors duration-300">
            <span>{views}</span>
            <span className="text-cosmic-sapphire">•</span>
            <span>{timestamp}</span>
          </div>
        </div>

        {/* Kebab menu - YouTube three-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {videoId && (
              <DropdownMenuItem onClick={() => { lightTap(); if (videoId) toggleWatchLater(videoId); }}>
                <Clock className="mr-2 h-4 w-4" />
                Xem sau
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleAddToPlaylist}>
              <Bookmark className="mr-2 h-4 w-4" />
              Lưu vào danh sách phát
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { lightTap(); setShareModalOpen(true); }}>
              <Share2 className="mr-2 h-4 w-4" />
              Chia sẻ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNotInterested}>
              <EyeOff className="mr-2 h-4 w-4" />
              Không quan tâm
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { lightTap(); toast({ title: "Đã báo cáo", description: "Cảm ơn bạn đã phản hồi" }); }}>
              <Flag className="mr-2 h-4 w-4" />
              Báo cáo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        contentType="video"
        contentId={videoId || ""}
        contentTitle={title || ""}
        thumbnailUrl={thumbnail}
        channelName={channel}
        userId={user?.id}
      />

      {videoId && (
        <AddToPlaylistModal
          open={playlistModalOpen}
          onOpenChange={setPlaylistModalOpen}
          videoId={videoId}
          videoTitle={title}
        />
      )}
    </Card>
  );
};
