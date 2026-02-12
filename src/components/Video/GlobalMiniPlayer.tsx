import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, ChevronUp, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { formatDuration } from "@/lib/formatters";

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
  const userInteractedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);

  const isOnWatchPage = location.pathname.startsWith("/watch/");
  const watchingVideoId = isOnWatchPage ? location.pathname.split("/watch/")[1] : null;
  const shouldHide = watchingVideoId === miniPlayerVideo?.id;

  // First-load autoplay: try unmuted, fallback muted + prompt
  const initialPlay = useCallback(async (video: HTMLVideoElement) => {
    console.log("[MiniPlayer] initialPlay called, src:", video.src?.slice(-60), "userInteracted:", userInteractedRef.current);
    if (userInteractedRef.current) {
      try { await video.play(); console.log("[MiniPlayer] Resumed (user-interacted)"); } catch (e: any) { console.error("[MiniPlayer] Resume failed:", e?.message); }
      return;
    }
    video.muted = false;
    try {
      await video.play();
      setIsMuted(false);
      setShowUnmutePrompt(false);
      console.log("[MiniPlayer] Autoplay unmuted OK");
    } catch (e: any) {
      console.warn("[MiniPlayer] Unmuted blocked:", e?.message, "-> trying muted");
      video.muted = true;
      setIsMuted(true);
      setShowUnmutePrompt(true);
      try { await video.play(); console.log("[MiniPlayer] Autoplay muted OK"); } catch (e2: any) { console.error("[MiniPlayer] Muted also failed:", e2?.message); }
    }
  }, []);

  // Handle play/pause state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !miniPlayerVideo) return;
    if (isPlaying) {
      initialPlay(video);
    } else {
      video.pause();
    }
  }, [isPlaying, miniPlayerVideo, initialPlay]);

  // Reset on new video (currentTime set via onLoadedMetadata)
  useEffect(() => {
    if (!miniPlayerVideo) return;
    userInteractedRef.current = false;
    setIsMuted(false);
    setShowUnmutePrompt(false);
    console.log("[MiniPlayer] New video:", miniPlayerVideo.id, "url:", miniPlayerVideo.videoUrl?.slice(-60));
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
    userInteractedRef.current = true;
    togglePlay();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    userInteractedRef.current = true;
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    setShowUnmutePrompt(false);
  };

  const handleUnmutePrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    userInteractedRef.current = true;
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

  if (!miniPlayerVideo || !isVisible || shouldHide) return null;

  const progress = miniPlayerVideo.duration > 0 
    ? (miniPlayerVideo.currentTime / miniPlayerVideo.duration) * 100 
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: -20, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className={cn(
          "fixed z-[60] left-0 right-0 bottom-16",
          "bg-background/98 backdrop-blur-xl",
          "border-t border-border",
          "shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        )}
      >
        {/* Hidden video element for audio playback */}
        <video
          ref={videoRef}
          src={miniPlayerVideo.videoUrl}
          className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          onLoadedMetadata={(e) => {
            const t = miniPlayerVideo.currentTime;
            if (t > 0) {
              e.currentTarget.currentTime = t;
              console.log("[MiniPlayer] Set currentTime to", t);
            }
          }}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video) updateProgress(video.currentTime, video.duration);
          }}
          onEnded={() => setIsPlaying(false)}
          onLoadedData={() => console.log("[MiniPlayer] Video loaded successfully")}
          onError={(e) => console.error("[MiniPlayer] Video error:", e.currentTarget.error?.message, "src:", e.currentTarget.src?.slice(-60))}
        />

        {/* Progress bar - full width at top */}
        <div className="h-[3px] bg-muted w-full">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main row: thumbnail + info + controls */}
        <div className="flex items-center gap-3 px-3 py-2" onClick={handleExpand}>
          {/* Thumbnail */}
          <div className="w-[60px] h-[34px] rounded overflow-hidden flex-shrink-0 bg-muted">
            {miniPlayerVideo.thumbnailUrl ? (
              <img 
                src={miniPlayerVideo.thumbnailUrl} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground leading-tight">
              {miniPlayerVideo.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
              {miniPlayerVideo.channelName} • {formatDuration(miniPlayerVideo.currentTime)}
            </p>
          </div>

          {/* Unmute prompt */}
          {showUnmutePrompt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnmutePrompt}
              className="h-7 text-[10px] px-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0"
            >
              <VolumeX className="h-3 w-3 mr-1" />
              Bật âm
            </Button>
          )}

          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-9 w-9 rounded-full text-foreground hover:bg-accent flex-shrink-0"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          {/* Volume */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMute}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
