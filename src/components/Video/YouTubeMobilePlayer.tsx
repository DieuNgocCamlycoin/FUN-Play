import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, Maximize, Minimize,
  SkipBack, SkipForward, RotateCcw, Settings, ChevronDown, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { PlayerSettingsDrawer } from "./PlayerSettingsDrawer";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAutoReward } from "@/hooks/useAutoReward";
import { useAuth } from "@/hooks/useAuth";
import { parseChapters, getCurrentChapter, type Chapter } from "@/lib/parseChapters";

interface YouTubeMobilePlayerProps {
  videoUrl: string;
  videoId: string;
  title: string;
  description?: string | null;
  onEnded?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onMinimize?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onAmbientColor?: (color: string | null) => void;
  exposeSeek?: (seekFn: (time: number) => void) => void;
}

export function YouTubeMobilePlayer({
  videoUrl,
  videoId,
  title,
  description,
  onEnded,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onMinimize,
  onPlayStateChange,
  onTimeUpdate,
  onAmbientColor,
  exposeSeek,
}: YouTubeMobilePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIndicator, setShowSkipIndicator] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  
  // Settings states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopMode, setLoopMode] = useState<"off" | "all" | "one">("off");
  
  const { lightTap } = useHapticFeedback();
  const navigate = useNavigate();
  
  // Reward system integration
  const { awardViewReward } = useAutoReward();
  const { user } = useAuth();
  const [viewRewarded, setViewRewarded] = useState(false);
  const watchTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const lastTapXRef = useRef(0);

  // Ambient mode
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambientIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [ambientEnabled, setAmbientEnabled] = useState(() => {
    try { return localStorage.getItem('funplay_ambient_mode') === 'true'; } catch { return false; }
  });

  // Chapters
  const chapters = useMemo(() => parseChapters(description), [description]);
  const currentChapter = useMemo(() => getCurrentChapter(chapters, currentTime), [chapters, currentTime]);

  // Skip amount changed from 10s to 15s
  const SKIP_SECONDS = 15;
  
  // Reward thresholds
  const SHORT_VIDEO_THRESHOLD = 5 * 60; // 5 minutes
  const LONG_VIDEO_MIN_WATCH = 5 * 60; // 5 minutes for long videos

  // Format time
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

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

  // Handle video end with loop support
  const handleVideoEnded = () => {
    if (loopMode === "one") {
      // Loop current video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    } else {
      setIsPlaying(false);
      onEnded?.();
    }
  };

  // Tap handler - single tap to toggle controls, double tap to skip
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    tapCountRef.current += 1;
    lastTapXRef.current = x;
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      if (tapCountRef.current === 1) {
        // Single tap - toggle controls visibility
        setShowControls(prev => {
          const newValue = !prev;
          // If showing controls and playing, set auto-hide timeout
          if (newValue && isPlaying) {
            if (hideControlsTimeoutRef.current) {
              clearTimeout(hideControlsTimeoutRef.current);
            }
            hideControlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
            }, 3000);
          }
          return newValue;
        });
      } else if (tapCountRef.current >= 2) {
        // Double tap - skip 15s
        const tapIsLeftHalf = lastTapXRef.current < rect.width / 2;
        if (tapIsLeftHalf) {
          seekRelative(-SKIP_SECONDS);
          setShowSkipIndicator('left');
        } else {
          seekRelative(SKIP_SECONDS);
          setShowSkipIndicator('right');
        }
        setTimeout(() => setShowSkipIndicator(null), 600);
      }
      tapCountRef.current = 0;
    }, 250); // 250ms window để detect double-tap
  };

  // Drag to minimize gesture - lowered threshold for easier triggering
  const handleDragEnd = (_event: any, info: PanInfo) => {
    setIsDragging(false);
    setDragY(0);
    
    // Lowered threshold from 100px to 80px and velocity to 300
    if (info.offset.y > 80 || info.velocity.y > 300) {
      lightTap();
      onMinimize?.();
    }
  };

  const handleDrag = (_event: any, info: PanInfo) => {
    if (info.offset.y > 0) {
      setDragY(info.offset.y);
    }
  };

  // Toggle fullscreen with responsive orientation
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
        
        // Lock orientation based on video aspect ratio
        const isPortraitVideo = video.videoHeight > video.videoWidth;
        try {
          const orientation = screen.orientation as any;
          if (orientation?.lock) {
            await orientation.lock(isPortraitVideo ? 'portrait' : 'landscape');
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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle orientation change in fullscreen
  useEffect(() => {
    const handleOrientation = () => {
      if (isFullscreen && videoRef.current) {
        // Force video to fill screen properly
        videoRef.current.style.objectFit = 'contain';
      }
    };

    window.addEventListener('orientationchange', handleOrientation);
    return () => window.removeEventListener('orientationchange', handleOrientation);
  }, [isFullscreen]);

  // Auto-play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [videoUrl]);

  // Notify parent of state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    onTimeUpdate?.(currentTime, duration);
  }, [currentTime, duration, onTimeUpdate]);

  // View reward tracking - Award CAMLY for watching videos
  useEffect(() => {
    const checkViewReward = async () => {
      if (viewRewarded || !user || !videoId || duration <= 0) return;
      
      const isShortVideo = duration < SHORT_VIDEO_THRESHOLD;
      
      if (isShortVideo) {
        // Short video: Must watch 90%+
        if (currentTime >= duration * 0.9) {
          setViewRewarded(true);
          console.log('[Mobile Reward] Short video 90% reached, awarding view reward');
          await awardViewReward(videoId);
        }
      } else {
        // Long video: Must watch at least 5 minutes continuously
        if (watchTimeRef.current >= LONG_VIDEO_MIN_WATCH) {
          setViewRewarded(true);
          console.log('[Mobile Reward] Long video 5min reached, awarding view reward');
          await awardViewReward(videoId);
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

  // Expose seek function to parent
  useEffect(() => {
    exposeSeek?.((time: number) => seekTo(time));
  }, [exposeSeek]);

  // Ambient Mode: sample dominant color from video frames
  useEffect(() => {
    if (!ambientEnabled || !videoRef.current || !onAmbientColor) {
      onAmbientColor?.(null);
      if (ambientIntervalRef.current) {
        clearInterval(ambientIntervalRef.current);
        ambientIntervalRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    if (!canvasRef.current) (canvasRef as any).current = canvas;
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const sampleColor = () => {
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2) return;
      try {
        ctx.drawImage(video, 0, 0, 4, 4);
        const imageData = ctx.getImageData(0, 0, 4, 4).data;
        let r = 0, g = 0, b = 0;
        const pixels = 16;
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
        }
        r = Math.round(r / pixels);
        g = Math.round(g / pixels);
        b = Math.round(b / pixels);
        onAmbientColor(`${r}, ${g}, ${b}`);
      } catch {
        // CORS or other errors
      }
    };

    ambientIntervalRef.current = setInterval(sampleColor, 2000);
    sampleColor();

    return () => {
      if (ambientIntervalRef.current) {
        clearInterval(ambientIntervalRef.current);
        ambientIntervalRef.current = null;
      }
    };
  }, [ambientEnabled, videoUrl, onAmbientColor]);

  const opacity = isDragging ? Math.max(0.3, 1 - dragY / 300) : 1;
  const scale = isDragging ? Math.max(0.7, 1 - dragY / 600) : 1;
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ opacity, scale }}
        className={cn(
          "relative bg-black overflow-hidden touch-none select-none",
          isFullscreen ? "fixed inset-0 z-[100]" : "aspect-video w-full"
        )}
        onClick={handleTap}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onEnded={handleVideoEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          webkit-playsinline="true"
        />

        {/* Hidden canvas for ambient color sampling */}
        <canvas ref={canvasRef} className="hidden" width={4} height={4} />

        {/* Thin progress bar always visible at bottom edge (when controls hidden) */}
        {!showControls && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-30">
            <div 
              className="h-full bg-gradient-to-r from-cosmic-magenta to-cosmic-cyan transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Chapter markers on thin bar */}
            {chapters.length > 0 && duration > 0 && chapters.map((chapter, idx) => (
              idx > 0 ? (
                <div
                  key={idx}
                  className="absolute top-0 h-full w-[2px] bg-white/80 z-10"
                  style={{ left: `${(chapter.time / duration) * 100}%` }}
                />
              ) : null
            ))}
          </div>
        )}

        {/* Skip Indicators */}
        <AnimatePresence>
          {showSkipIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-black/60 flex items-center justify-center",
                showSkipIndicator === 'left' ? "left-8" : "right-8"
              )}
            >
              <div className="text-center">
                <RotateCcw className={cn(
                  "h-10 w-10 text-white mx-auto",
                  showSkipIndicator === 'right' && "transform scale-x-[-1]"
                )} />
                <span className="text-white text-sm font-semibold">{SKIP_SECONDS}s</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: showControls ? 1 : 0 }}
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity",
            !showControls && "pointer-events-none"
          )}
        >
          {/* Top bar - Close (X) + Minimize + Settings */}
          <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Close button (X) - Đóng và quay về trang chủ */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { 
                  e.stopPropagation();
                  lightTap();
                  navigate('/');
                }}
                className="h-10 w-10 text-white hover:bg-red-500/30 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
              
              {/* Minimize button - Thu nhỏ thành mini-player */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { 
                  e.stopPropagation();
                  lightTap();
                  onMinimize?.(); 
                }}
                className="h-10 w-10 text-white hover:bg-white/20 rounded-full"
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white h-10 w-10 hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen(true);
              }}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Center controls - Prev | Play/Pause | Next */}
          <div className="absolute inset-0 flex items-center justify-center gap-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
              disabled={!hasPrevious}
              className={cn(
                "h-14 w-14 text-white hover:bg-white/20 rounded-full",
                !hasPrevious && "opacity-40"
              )}
            >
              <SkipBack className="h-7 w-7" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="h-18 w-18 text-white bg-black/30 hover:bg-black/50 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-12 w-12" />
              ) : (
                <Play className="h-12 w-12 ml-1" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              disabled={!hasNext}
              className={cn(
                "h-14 w-14 text-white hover:bg-white/20 rounded-full",
                !hasNext && "opacity-40"
              )}
            >
              <SkipForward className="h-7 w-7" />
            </Button>
          </div>

          {/* Bottom controls - Time + Progress + Fullscreen */}
          <div className="absolute bottom-0 inset-x-0 p-3 space-y-1">
            {/* Progress bar with chapter markers */}
            <div className="px-2 relative">
              {/* Chapter markers overlay */}
              {chapters.length > 0 && duration > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center">
                  {chapters.map((chapter, idx) => (
                    idx > 0 ? (
                      <div
                        key={idx}
                        className="absolute h-4 w-[2px] bg-white/70"
                        style={{ left: `${(chapter.time / duration) * 100}%` }}
                      />
                    ) : null
                  ))}
                </div>
              )}
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={([value]) => seekTo(value)}
                className="cursor-pointer h-6"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Current chapter title */}
            {currentChapter && chapters.length > 0 && (
              <div className="px-2 text-white/70 text-xs truncate">
                {currentChapter.title}
              </div>
            )}

            {/* Time & Fullscreen */}
            <div className="flex items-center justify-between px-2">
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="h-10 w-10 text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Drag indicator - Enhanced with gradient */}
        {isDragging && (
          <motion.div 
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500/80 to-purple-500/80 rounded-full px-4 py-2 backdrop-blur-sm shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-white text-sm font-medium flex items-center gap-2">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              Kéo xuống để thu nhỏ
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Settings Drawer */}
      <PlayerSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        loopMode={loopMode}
        onLoopChange={setLoopMode}
        ambientEnabled={ambientEnabled}
        onAmbientToggle={(enabled) => {
          setAmbientEnabled(enabled);
          localStorage.setItem('funplay_ambient_mode', String(enabled));
        }}
      />
    </>
  );
}
