import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isVideoWatchPage } from "@/lib/videoNavigation";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Maximize2, Volume2, VolumeX } from "lucide-react";
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
  const [isMuted, setIsMuted] = useState(false);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);

  const isOnWatchPage = isVideoWatchPage(location.pathname);
  const shouldHide = isOnWatchPage;

  // Reliable autoplay: try unmuted first, fallback to muted + prompt
  const attemptPlay = useCallback(async (video: HTMLVideoElement) => {
    video.muted = false;
    try {
      await video.play();
      setIsMuted(false);
      setShowUnmutePrompt(false);
    } catch {
      // Browser blocked unmuted autoplay — fallback to muted
      video.muted = true;
      setIsMuted(true);
      setShowUnmutePrompt(true);
      try {
        await video.play();
      } catch {
        // Even muted play failed — give up silently
      }
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !miniPlayerVideo) return;

    if (isPlaying) {
      attemptPlay(video);
    } else {
      video.pause();
    }
  }, [isPlaying, miniPlayerVideo, attemptPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !miniPlayerVideo) return;
    
    if (miniPlayerVideo.currentTime > 0) {
      video.currentTime = miniPlayerVideo.currentTime;
    }
    // Reset mute state for new video
    setIsMuted(false);
    setShowUnmutePrompt(false);
  }, [miniPlayerVideo?.id]);

  const handleExpand = async () => {
    if (miniPlayerVideo) {
      lightTap();
      const { getVideoPath } = await import("@/lib/videoNavigation");
      const path = await getVideoPath(miniPlayerVideo.id);
      navigate(path);
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

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      setShowUnmutePrompt(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleUnmutePromptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    setShowUnmutePrompt(false);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
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
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) {
                updateProgress(video.currentTime, video.duration);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Unmute prompt badge */}
          {showUnmutePrompt && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleUnmutePromptClick}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20"
            >
              <VolumeX className="h-3 w-3" />
              Bật âm thanh
            </motion.button>
          )}
          
          {/* Progress bar */}
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
        <div className="p-2 flex items-center gap-1 bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-8 w-8 text-foreground hover:bg-accent rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0 px-0.5">
            <p className="text-[10px] text-cosmic-cyan font-medium leading-none mb-0.5">Đang phát</p>
            <p className="text-xs font-semibold truncate text-foreground leading-tight">
              {miniPlayerVideo.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {miniPlayerVideo.channelName}
            </p>
          </div>

          {/* Volume toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMute}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-white hover:bg-red-500/20"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
