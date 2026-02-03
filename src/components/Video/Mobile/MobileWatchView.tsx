import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { YouTubeMobilePlayer } from "../YouTubeMobilePlayer";
import { VideoInfoSection } from "./VideoInfoSection";
import { VideoActionsBar } from "./VideoActionsBar";
import { CommentsCard } from "./CommentsCard";
import { CommentsDrawer } from "./CommentsDrawer";
import { UpNextSidebar } from "../UpNextSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import MiniPlayer from "../MiniPlayer";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";

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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface MobileWatchViewProps {
  video: Video;
  comments: Comment[];
  isSubscribed: boolean;
  hasLiked: boolean;
  onSubscribe: () => void;
  onLike: () => void;
  onShare: () => void;
  onVideoEnd: () => void;
}

export function MobileWatchView({
  video,
  comments,
  isSubscribed,
  hasLiked,
  onSubscribe,
  onLike,
  onShare,
  onVideoEnd,
}: MobileWatchViewProps) {
  const navigate = useNavigate();
  const { session, nextVideo, previousVideo, getUpNext } = useVideoPlayback();
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Handle minimize - navigate to home with mini player
  const handleMinimize = () => {
    setIsMinimized(true);
    // Navigate to home while keeping mini player active
    navigate("/", {
      state: {
        miniPlayerVideo: {
          id: video.id,
          videoUrl: video.video_url,
          title: video.title,
          channelName: video.channels.name,
          thumbnailUrl: video.thumbnail_url,
          currentTime,
          duration,
          isPlaying,
        },
      },
    });
  };

  // Handle expand from mini player
  const handleExpand = () => {
    setIsMinimized(false);
    playerRef.current?.scrollIntoView({ behavior: "smooth" });
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
  const latestComment = comments.length > 0 ? comments[0] : null;

  // If minimized, show mini player
  if (isMinimized) {
    return (
      <MiniPlayer
        videoUrl={video.video_url}
        title={video.title}
        channelName={video.channels.name}
        thumbnailUrl={video.thumbnail_url}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onClose={() => setIsMinimized(false)}
        onExpand={handleExpand}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
      />
    );
  }

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
          commentCount={comments.length}
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
        commentCount={comments.length}
      />
    </div>
  );
}
