import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { YouTubeMobilePlayer } from "../YouTubeMobilePlayer";
import { VideoInfoSection } from "./VideoInfoSection";
import { VideoActionsBar } from "./VideoActionsBar";
import { CommentsCard } from "./CommentsCard";
import { CommentsDrawer } from "./CommentsDrawer";
import { UpNextSidebar } from "../UpNextSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { useVideoComments } from "@/hooks/useVideoComments";
import { toast } from "sonner";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  created_at: string;
  user_id: string;
  channels: {
    id: string;
    name: string;
    subscriber_count: number;
    is_verified?: boolean;
  };
}

interface MobileWatchViewProps {
  video: Video;
  isSubscribed: boolean;
  hasLiked: boolean;
  hasDisliked?: boolean;
  onSubscribe: () => void;
  onLike: () => void;
  onDislike?: () => void;
  onShare: () => void;
  onVideoEnd: () => void;
  channelAvatarUrl?: string | null;
}

export function MobileWatchView({
  video,
  isSubscribed,
  hasLiked,
  hasDisliked = false,
  onSubscribe,
  onLike,
  onDislike,
  onShare,
  onVideoEnd,
  channelAvatarUrl,
}: MobileWatchViewProps) {
  const navigate = useNavigate();
  const { session, nextVideo, previousVideo, getUpNext } = useVideoPlayback();
  const { showMiniPlayer } = useMiniPlayer();
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerSeekRef = useRef<((time: number) => void) | null>(null);

  // Use new hook for comments
  const { comments, totalCount } = useVideoComments({ videoId: video.id, videoOwnerId: video.user_id });

  // Listen for reward events and show toast on mobile
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const typeLabel = detail.type === 'VIEW' ? 'xem video' : detail.type;
      toast.success(`+${Number(detail.amount).toLocaleString()} CAMLY`, {
        description: `Thưởng ${typeLabel}`,
        duration: 3000,
      });
    };
    window.addEventListener('camly-reward', handler);
    return () => window.removeEventListener('camly-reward', handler);
  }, []);

  // Handle minimize - show mini player and navigate to home
  const handleMinimize = () => {
    showMiniPlayer({
      id: video.id,
      videoUrl: video.video_url,
      title: video.title,
      channelName: video.channels.name,
      thumbnailUrl: video.thumbnail_url,
      currentTime,
      duration,
    });
    navigate("/");
  };

  const handlePrevious = () => {
    const prev = previousVideo();
    if (prev) {
      navigate(`/watch/${prev.id}`);
    }
  };

  const handleNext = () => {
    const next = nextVideo();
    if (next) {
      navigate(`/watch/${next.id}`);
    }
  };

  const handleSeekToChapter = (seconds: number) => {
    playerSeekRef.current?.(seconds);
  };

  // Get latest comment for preview
  const latestComment = comments.length > 0 ? {
    profiles: {
      display_name: comments[0].profiles.display_name,
      avatar_url: comments[0].profiles.avatar_url,
    },
    content: comments[0].content,
  } : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Video Player */}
      <div ref={playerRef} className="w-full">
        <YouTubeMobilePlayer
          videoUrl={video.video_url}
          videoId={video.id}
          title={video.title}
          description={video.description}
          onEnded={onVideoEnd}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={session?.history && session.history.length > 1}
          hasNext={getUpNext(1).length > 0}
          onMinimize={handleMinimize}
          onPlayStateChange={setIsPlaying}
          onTimeUpdate={(time, dur) => {
            setCurrentTime(time);
            setDuration(dur);
          }}
          onAmbientColor={setAmbientColor}
          exposeSeek={(fn) => { playerSeekRef.current = fn; }}
        />
      </div>

      {/* Ambient Mode glow effect */}
      {ambientColor && (
        <div
          className="w-full h-20 -mt-1 pointer-events-none transition-all duration-1000"
          style={{
            background: `linear-gradient(to bottom, rgba(${ambientColor}, 0.25) 0%, transparent 100%)`,
          }}
        />
      )}

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        {/* Video Info Section */}
        <VideoInfoSection
          title={video.title}
          description={video.description}
          viewCount={video.view_count}
          likeCount={video.like_count}
          createdAt={video.created_at}
          channelName={video.channels.name}
          onSeekToChapter={handleSeekToChapter}
        />

        {/* Actions Bar */}
        <VideoActionsBar
          channelId={video.channels.id}
          channelName={video.channels.name}
          channelAvatar={channelAvatarUrl}
          subscriberCount={video.channels.subscriber_count}
          isSubscribed={isSubscribed}
          onSubscribe={onSubscribe}
          likeCount={video.like_count}
          hasLiked={hasLiked}
          hasDisliked={hasDisliked}
          onLike={onLike}
          onDislike={onDislike}
          onShare={onShare}
          videoUrl={video.video_url}
          videoTitle={video.title}
          videoId={video.id}
          isVerified={video.channels.is_verified}
        />

        {/* Comments Card */}
        <CommentsCard
          commentCount={totalCount}
          latestComment={latestComment}
          onClick={() => setShowCommentsDrawer(true)}
        />

        {/* Related Videos */}
        <div className="px-3 py-4">
          <UpNextSidebar onVideoSelect={(v) => navigate(`/watch/${v.id}`)} />
        </div>
      </ScrollArea>

      {/* Comments Drawer */}
      <CommentsDrawer
        isOpen={showCommentsDrawer}
        onClose={() => setShowCommentsDrawer(false)}
        videoId={video.id}
        videoOwnerId={video.user_id}
        channelName={video.channels.name}
      />
    </div>
  );
}
