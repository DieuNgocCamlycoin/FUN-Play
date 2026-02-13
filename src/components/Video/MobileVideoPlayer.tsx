import { useState, useRef, useEffect, useCallback, TouchEvent } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, RotateCcw, Settings, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoReward } from "@/hooks/useAutoReward";
import { useAuth } from "@/hooks/useAuth";

interface MobileVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  title: string;
  onEnded?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export function MobileVideoPlayer({
  videoUrl,
  videoId,
  title,
  onEnded,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onMinimize,
  isMinimized = false,
}: MobileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIndicator, setShowSkipIndicator] = useState<'left' | 'right' | null>(null);
  const [lastTap, setLastTap] = useState<{ time: number; x: number } | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reward system integration
  const { awardViewReward } = useAutoReward();
  const { user } = useAuth();
  const [viewRewarded, setViewRewarded] = useState(false);
  const watchTimeRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Touch gesture handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialVolumeRef = useRef(1);

  // Reward thresholds
  const SHORT_VIDEO_THRESHOLD = 5 * 60; // 5 minutes
  const LONG_VIDEO_MIN_WATCH = 5 * 60; // 5 minutes for long videos

  // Format time
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying && !isMinimized) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isMinimized]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimeout]);

  // Toggle play
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Seek functions
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  };

  const seekRelative = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  };

  // Double tap to skip
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    if (lastTap && now - lastTap.time < 300) {
      // Double tap detected
      if (isLeftHalf) {
        seekRelative(-10);
        setShowSkipIndicator('left');
      } else {
        seekRelative(10);
        setShowSkipIndicator('right');
      }
      setTimeout(() => setShowSkipIndicator(null), 500);
      setLastTap(null);
    } else {
      setLastTap({ time: now, x });
      // Single tap - toggle controls
      setTimeout(() => {
        if (lastTap?.time === now) {
          resetControlsTimeout();
        }
      }, 300);
    }
  };

  // Swipe gestures for volume
  const handleTouchStart = (e: TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    initialVolumeRef.current = volume;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaY = touchStartRef.current.y - e.touches[0].clientY;
    const sensitivity = 200;
    const newVolume = Math.max(0, Math.min(1, initialVolumeRef.current + deltaY / sensitivity));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
        // Lock to landscape on mobile
        try {
          const orientation = screen.orientation as any;
          if (orientation?.lock) {
            await orientation.lock('landscape');
          }
        } catch (e) {
          console.log('Orientation lock not supported');
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        try {
          const orientation = screen.orientation as any;
          if (orientation?.unlock) {
            orientation.unlock();
          }
        } catch (e) {
          console.log('Orientation unlock not supported');
        }
      }
    } catch (e) {
      console.error("Fullscreen error:", e);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [videoUrl]);

  // View reward tracking - Award CAMLY for watching videos
  useEffect(() => {
    const checkViewReward = async () => {
      if (viewRewarded || !user || !videoId || duration <= 0) return;
      
      const isShortVideo = duration < SHORT_VIDEO_THRESHOLD;
      
      if (isShortVideo) {
        // Short video: Must watch 60%+
        if (currentTime >= duration * 0.6) {
          setViewRewarded(true);
          console.log('[Mobile Reward] Short video 90% reached, awarding view reward');
          const result = await awardViewReward(videoId);
          if (result) {
            window.dispatchEvent(new CustomEvent("camly-reward", {
              detail: { type: "VIEW", amount: 10000 }
            }));
          }
        }
      } else {
        // Long video: Must watch at least 5 minutes continuously
        if (watchTimeRef.current >= LONG_VIDEO_MIN_WATCH) {
          setViewRewarded(true);
          console.log('[Mobile Reward] Long video 5min reached, awarding view reward');
          const result = await awardViewReward(videoId);
          if (result) {
            window.dispatchEvent(new CustomEvent("camly-reward", {
              detail: { type: "VIEW", amount: 10000 }
            }));
          }
        }
      }
    };
    
    if (isPlaying && duration > 0) {
      const interval = setInterval(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const current = video.currentTime;
        // Only count time if watching continuously (not skipping)
        if (Math.abs(current - lastTimeRef.current) < 2) {
          watchTimeRef.current += 1;
        }
        lastTimeRef.current = current;
        
        checkViewReward();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration, currentTime, viewRewarded, user, videoId, awardViewReward]);

  // Reset reward state when video changes
  useEffect(() => {
    setViewRewarded(false);
    watchTimeRef.current = 0;
    lastTimeRef.current = 0;
  }, [videoId]);

  // Mini player view
  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-2 right-2 h-16 bg-background border border-border rounded-lg z-40 flex items-center gap-3 px-2 shadow-lg lg:hidden"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-24 h-12 object-cover rounded"
          onClick={togglePlay}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={togglePlay} className="h-10 w-10">
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onMinimize} className="h-10 w-10">
          <X className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black overflow-hidden touch-none",
        isFullscreen ? "fixed inset-0 z-[100]" : "aspect-video w-full rounded-xl"
      )}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        webkit-playsinline="true"
      />

      {/* Skip Indicators */}
      <AnimatePresence>
        {showSkipIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center",
              showSkipIndicator === 'left' ? "left-8" : "right-8"
            )}
          >
            {showSkipIndicator === 'left' ? (
              <div className="text-center">
                <RotateCcw className="h-8 w-8 text-white mx-auto" />
                <span className="text-white text-sm">10s</span>
              </div>
            ) : (
              <div className="text-center">
                <RotateCcw className="h-8 w-8 text-white mx-auto transform scale-x-[-1]" />
                <span className="text-white text-sm">10s</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity",
          !showControls && "pointer-events-none"
        )}
      >
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between">
          <h3 className="text-white text-sm font-semibold truncate flex-1 mr-4">{title}</h3>
          <Button variant="ghost" size="icon" className="text-white h-10 w-10">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          {hasPrevious && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
              className="h-12 w-12 text-white hover:bg-white/20"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="h-16 w-16 text-white bg-black/30 hover:bg-black/50 rounded-full"
          >
            {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
          </Button>
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              className="h-12 w-12 text-white hover:bg-white/20"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2">
          {/* Progress bar */}
          <div className="px-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={([value]) => seekTo(value)}
              className="cursor-pointer h-6"
            />
          </div>

          {/* Time & controls */}
          <div className="flex items-center justify-between px-2">
            <span className="text-white text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="h-10 w-10 text-white"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="h-10 w-10 text-white"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
