import { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlobalMiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    miniPlayerVideo, 
    isPlaying, 
    isVisible, 
    hideMiniPlayer, 
    togglePlay,
    setIsPlaying,
    updateProgress,
  } = useMiniPlayer();
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Don't show mini player if we're on the watch page for the same video
  const isOnWatchPage = location.pathname.startsWith("/watch/");
  const watchingVideoId = isOnWatchPage ? location.pathname.split("/watch/")[1] : null;
  const shouldHide = watchingVideoId === miniPlayerVideo?.id;

  // Sync video play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !miniPlayerVideo) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, miniPlayerVideo]);

  // Set initial time when showing mini player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !miniPlayerVideo) return;
    
    if (miniPlayerVideo.currentTime > 0) {
      video.currentTime = miniPlayerVideo.currentTime;
    }
  }, [miniPlayerVideo?.id]);

  const handleExpand = () => {
    if (miniPlayerVideo) {
      navigate(`/watch/${miniPlayerVideo.id}`);
      hideMiniPlayer();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    hideMiniPlayer();
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  if (!miniPlayerVideo || !isVisible || shouldHide) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed bottom-20 right-2 z-50",
          "w-40 rounded-lg overflow-hidden",
          "bg-black shadow-2xl",
          "border border-white/20",
          "cursor-pointer"
        )}
        onClick={handleExpand}
      >
        {/* Video */}
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={miniPlayerVideo.videoUrl}
            className="w-full h-full object-cover"
            playsInline
            muted={false}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) {
                updateProgress(video.currentTime, video.duration);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-primary transition-all duration-200"
              style={{ 
                width: `${miniPlayerVideo.duration > 0 
                  ? (miniPlayerVideo.currentTime / miniPlayerVideo.duration) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-2 flex items-center gap-1 bg-background/95 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-8 w-8 text-foreground hover:bg-accent"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0 px-1">
            <p className="text-xs font-medium truncate text-foreground">
              {miniPlayerVideo.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {miniPlayerVideo.channelName}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
