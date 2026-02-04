import { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export function GlobalMiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHapticFeedback();
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
      lightTap();
      navigate(`/watch/${miniPlayerVideo.id}`);
      hideMiniPlayer();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    hideMiniPlayer();
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    togglePlay();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Swipe down to dismiss
    if (info.offset.y > 50 || info.velocity.y > 200) {
      lightTap();
      hideMiniPlayer();
    }
  };

  if (!miniPlayerVideo || !isVisible || shouldHide) {
    return null;
  }

  const progressPercentage = miniPlayerVideo.duration > 0 
    ? (miniPlayerVideo.currentTime / miniPlayerVideo.duration) * 100 
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: -30, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className={cn(
          "fixed z-[60]",
          "bottom-[76px] right-3",
          "w-44 rounded-xl overflow-hidden",
          "bg-background/95 backdrop-blur-lg",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "border-2 border-cosmic-cyan/40",
          "cursor-pointer",
          "animate-mini-player-border"
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Progress bar - gradient theo Design System */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div 
              className="h-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Expand indicator */}
          <div className="absolute top-2 right-2">
            <Maximize2 className="h-4 w-4 text-white/80" />
          </div>
        </div>

        {/* Controls */}
        <div className="p-2 flex items-center gap-1.5 bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-9 w-9 text-foreground hover:bg-accent rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0 px-1">
            <p className="text-xs font-semibold truncate text-foreground">
              {miniPlayerVideo.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {miniPlayerVideo.channelName}
            </p>
          </div>

          {/* Close button - more prominent */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-white hover:bg-red-500/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
