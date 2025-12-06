import { useState } from "react";
import { Play, Volume2, Edit, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareModal } from "./ShareModal";

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

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (channelId) {
      navigate(`/channel/${channelId}`);
    }
  };

  return (
    <Card className="group overflow-hidden bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer relative rounded-xl">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl" onClick={handlePlay}>
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-white/90 hover:bg-white shadow-lg"
          >
            <Play className="h-7 w-7 fill-current text-gray-800" />
          </Button>
        </div>

        {/* Edit button for owner */}
        {isOwner && (
          <Button
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 bg-white/90 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md"
            onClick={handleEdit}
            title="Chỉnh sửa trong Studio"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Share button */}
        <Button
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-cyan-400 hover:bg-cyan-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md rounded-full"
          onClick={handleShare}
          title="Chia sẻ video"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="p-3 flex gap-3 bg-white">
        <div className="flex-shrink-0" onClick={handleChannelClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channel}
              className="w-9 h-9 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform border border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform">
              {channel?.[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
            {title}
          </h3>
          <p 
            className="text-xs text-gray-500 cursor-pointer hover:text-purple-500 transition-colors"
            onClick={handleChannelClick}
          >
            {channel}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>{views}</span>
            <span>•</span>
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
    </Card>
  );
};
