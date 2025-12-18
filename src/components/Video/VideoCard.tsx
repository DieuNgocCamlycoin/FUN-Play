import { useState } from "react";
import { Play, Volume2, Edit, Share2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareModal } from "./ShareModal";
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
  const { toast } = useToast();
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
    if (onPlay && videoId) {
      onPlay(videoId);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/studio?tab=content&edit=${videoId}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareModalOpen(true);
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <Card className="group overflow-hidden bg-white/95 dark:bg-white/90 backdrop-blur-sm holographic border-2 border-white/30 hover:border-white/50 transition-all duration-500 cursor-pointer relative shadow-lg">
      {/* Rainbow diamond sparkle effect on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-glow-sapphire rounded-full animate-[sparkle_1s_ease-in-out_infinite] shadow-[0_0_20px_rgba(0,102,255,1)]" />
        <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-glow-cyan rounded-full animate-[sparkle_1.2s_ease-in-out_infinite_0.2s] shadow-[0_0_18px_rgba(0,255,255,1)]" />
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-glow-magenta rounded-full animate-[sparkle_1.4s_ease-in-out_infinite_0.4s] shadow-[0_0_20px_rgba(217,0,255,1)]" />
        <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-divine-rose-gold rounded-full animate-[sparkle_1.1s_ease-in-out_infinite_0.3s] shadow-[0_0_15px_rgba(255,183,246,1)]" />
        <div className="absolute bottom-1/3 left-1/2 w-2.5 h-2.5 bg-glow-gold rounded-full animate-[sparkle_1.3s_ease-in-out_infinite_0.5s] shadow-[0_0_18px_rgba(255,215,0,1)]" />
        <div className="absolute top-2/3 right-1/2 w-2 h-2 bg-glow-white rounded-full animate-[sparkle_0.9s_ease-in-out_infinite_0.6s] shadow-[0_0_15px_rgba(255,255,255,1)]" />
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg" onClick={handlePlay}>
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Rainbow prism halo overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-glow-sapphire/30 via-glow-cyan/25 via-glow-magenta/25 to-divine-rose-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Play button overlay with cosmic divine glow */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta divine-glow border-2 border-glow-cyan shadow-[0_0_60px_rgba(0,255,255,1)]"
          >
            <Play className="h-8 w-8 fill-current text-foreground" />
          </Button>
        </div>

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

        {/* Add to Playlist button */}
        {user && (
          <Button
            size="icon"
            className="absolute top-2 right-12 h-8 w-8 bg-cosmic-cyan/90 hover:bg-cosmic-cyan border border-glow-cyan text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_40px_rgba(0,255,255,0.9)]"
            onClick={handleAddToPlaylist}
            title="Thêm vào danh sách phát"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        )}

        {/* Share button with sapphire glow */}
        <Button
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-cosmic-sapphire/90 hover:bg-cosmic-sapphire border border-glow-sapphire text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_40px_rgba(0,102,255,0.9)]"
          onClick={handleShare}
          title="Chia sẻ video"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info with glassmorphism */}
      <div className="p-4 flex gap-3 bg-white/80">
        <div className="flex-shrink-0" onClick={handleChannelClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channel}
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,255,255,0.7)]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta flex items-center justify-center text-foreground font-bold text-sm shadow-[0_0_30px_rgba(0,255,255,0.7)] cursor-pointer hover:scale-110 transition-transform">
              {channel[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm line-clamp-2 mb-1 text-gray-900 group-hover:text-cosmic-cyan transition-colors duration-300">
            {title}
          </h3>
          <p 
            className="text-xs text-gray-600 group-hover:text-divine-rose-gold transition-colors duration-300 cursor-pointer hover:underline"
            onClick={handleChannelClick}
          >
            {channel}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-cosmic-magenta mt-1 transition-colors duration-300">
            <span>{views}</span>
            <span className="text-cosmic-sapphire">•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        videoId={videoId}
        videoTitle={title}
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
