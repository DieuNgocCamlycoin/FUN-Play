import { useState } from "react";
import { Play, Edit, Share2, ListPlus } from "lucide-react";
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
import { getDefaultThumbnail } from "@/lib/defaultThumbnails";

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
  const { toast } = useToast();
  const { lightTap } = useHapticFeedback();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const isOwner = user?.id === userId;

  // Loading skeleton - YouTube style
  if (isLoading) {
    return (
      <div className="overflow-hidden">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="pt-3 flex gap-3">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
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

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="group cursor-pointer">
      {/* Thumbnail - YouTube style with rounded corners */}
      <div 
        className="relative aspect-video overflow-hidden rounded-xl bg-muted"
        onClick={handlePlay}
      >
        <LazyImage
          src={thumbnail || getDefaultThumbnail(videoId || '')}
          alt={title || 'Video thumbnail'}
          aspectRatio="video"
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        
        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="h-12 w-12 rounded-full bg-black/70 flex items-center justify-center">
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          </div>
        </div>

        {/* Action buttons on hover - YouTube style positioning */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Watch Later */}
          {videoId && (
            <div onClick={(e) => e.stopPropagation()}>
              <WatchLaterButton videoId={videoId} />
            </div>
          )}
          
          {/* Add to Playlist */}
          {user && (
            <Button
              size="icon"
              className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0 rounded-sm"
              onClick={handleAddToPlaylist}
              title="Thêm vào danh sách phát"
            >
              <ListPlus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Edit button for owner */}
        {isOwner && (
          <Button
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={handleEdit}
            title="Chỉnh sửa video"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Share button */}
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 bg-black/70 hover:bg-black/90 text-white border-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={handleShare}
          title="Chia sẻ video"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Info - YouTube style layout */}
      <div className="pt-3 flex gap-3">
        {/* Channel Avatar */}
        <div className="flex-shrink-0" onClick={handleChannelClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channel}
              className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm cursor-pointer hover:opacity-80 transition-opacity">
              {channel?.[0] || "?"}
            </div>
          )}
        </div>

        {/* Title, Channel, Views */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-sm text-foreground line-clamp-2 leading-snug mb-1 group-hover:text-foreground/90"
            onClick={handlePlay}
          >
            {title}
          </h3>
          <p 
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
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

      {videoId && (
        <AddToPlaylistModal
          open={playlistModalOpen}
          onOpenChange={setPlaylistModalOpen}
          videoId={videoId}
          videoTitle={title}
        />
      )}
    </div>
  );
};
