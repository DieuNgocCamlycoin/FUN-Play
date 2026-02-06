import { useState, useRef } from "react";
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
  };
}

interface MobileWatchViewProps {
  video: Video;
  isSubscribed: boolean;
  hasLiked: boolean;
  onSubscribe: () => void;
  onLike: () => void;
  onShare: () => void;
  onVideoEnd: () => void;
}

export function MobileWatchView({
  video,
  isSubscribed,
  hasLiked,
  onSubscribe,
  onLike,
  onShare,
  onVideoEnd,
}: MobileWatchViewProps) {
  const navigate = useNavigate();
  const { session, nextVideo, previousVideo, getUpNext } = useVideoPlayback();
  const { showMiniPlayer } = useMiniPlayer();
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Use new hook for comments
  const { comments, totalCount } = useVideoComments({ videoId: video.id, videoOwnerId: video.user_id });

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
        />
      </div>

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
        />

        {/* Actions Bar */}
        <VideoActionsBar
          channelId={video.channels.id}
          channelName={video.channels.name}
          subscriberCount={video.channels.subscriber_count}
          isSubscribed={isSubscribed}
          onSubscribe={onSubscribe}
          likeCount={video.like_count}
          hasLiked={hasLiked}
          onLike={onLike}
          onShare={onShare}
          videoUrl={video.video_url}
          videoTitle={video.title}
          videoId={video.id}
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
