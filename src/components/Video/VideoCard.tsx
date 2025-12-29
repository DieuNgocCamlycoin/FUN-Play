import { useState } from "react";
import { Play, Edit, Share2, ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ShareModal } from "./ShareModal";
import { LazyImage } from "@/components/ui/LazyImage";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { getDefaultThumbnail } from "@/lib/defaultThumbnails";
import { WatchLaterButton } from "./WatchLaterButton";
import { AddToPlaylistModal } from "@/components/Playlist/AddToPlaylistModal";
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
  onPlay?: (videoId: string) => void;
  isLoading?: boolean;
}

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
  onPlay,
  isLoading = false,
}: VideoCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lightTap } = useHapticFeedback();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const isOwner = user?.id === userId;

  // Loading skeleton with FunPlay shimmer effect
  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden rounded-xl p-2">
        <Skeleton className="aspect-video w-full rounded-xl bg-gradient-to-r from-cosmic-cyan/20 via-cosmic-magenta/20 to-cosmic-gold/20 animate-pulse" />
        <div className="pt-3 flex gap-3">
          <Skeleton className="w-9 h-9 rounded-full bg-gradient-to-br from-cosmic-sapphire/30 to-cosmic-cyan/30" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full bg-gradient-to-r from-cosmic-cyan/20 to-cosmic-magenta/20" />
            <Skeleton className="h-3 w-3/4 bg-cosmic-sapphire/20" />
            <Skeleton className="h-3 w-1/2 bg-cosmic-gold/20" />
          </div>
        </div>
      </div>
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

  const handleOpenPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    setPlaylistModalOpen(true);
  };

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (channelId) {
      navigate(`/channel/${channelId}`);
    }
  };

  return (
    <div className="group cursor-pointer glass-card rounded-xl p-2 transition-all duration-300">
      {/* Thumbnail with gradient overlay */}
      <div 
        className="relative aspect-video overflow-hidden rounded-xl bg-muted"
        onClick={handlePlay}
      >
        <LazyImage
          src={thumbnail || getDefaultThumbnail(videoId || '')}
          alt={title || 'Video thumbnail'}
          aspectRatio="video"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button overlay - Xanh ngọc lam thiên đường */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-14 w-14 rounded-full bg-cosmic-cyan flex items-center justify-center shadow-[0_0_40px_rgba(0,255,255,0.9)]">
            <Play className="h-6 w-6 fill-white text-white ml-0.5" />
          </div>
        </div>

        {/* Edit button for owner */}
        {isOwner && (
          <Button
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 bg-black/70 hover:bg-cosmic-cyan/80 text-white border-0 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={handleEdit}
            title="Chỉnh sửa video"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* 3 Action buttons ở góc phải trên - xếp dọc giống YouTube */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {/* Watch Later */}
          <WatchLaterButton 
            videoId={videoId || ""} 
            variant="icon"
            className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0 rounded-sm"
          />
          
          {/* Add to Playlist */}
          <Button
            size="icon"
            className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0 rounded-sm"
            onClick={handleOpenPlaylist}
            title="Thêm vào danh sách phát"
          >
            <ListVideo className="h-4 w-4" />
          </Button>
          
          {/* Share */}
          <Button
            size="icon"
            className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0 rounded-sm"
            onClick={handleShare}
            title="Chia sẻ video"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Info */}
      <div className="pt-3 flex gap-3">
        {/* Channel Avatar */}
        <div className="flex-shrink-0" onClick={handleChannelClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channel}
              className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-cosmic-cyan transition-all"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transition-shadow">
              {channel?.[0] || "?"}
            </div>
          )}
        </div>

        {/* Title, Channel, Views */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-sm text-foreground line-clamp-2 leading-snug mb-1 group-hover:text-cosmic-cyan transition-colors cursor-pointer"
            onClick={handlePlay}
          >
            {title}
          </h3>
          <p 
            className="text-xs text-muted-foreground hover:text-cosmic-cyan cursor-pointer transition-colors"
            onClick={handleChannelClick}
          >
            {channel}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <span>{views}</span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
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

      <AddToPlaylistModal
        open={playlistModalOpen}
        onOpenChange={setPlaylistModalOpen}
        videoId={videoId || ""}
        videoTitle={title || ""}
      />
    </div>
  );
};
