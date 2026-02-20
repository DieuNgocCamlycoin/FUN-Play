import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, RotateCcw,
  PictureInPicture2, Shuffle, ChevronRight,
  Check, X, Sun, RectangleHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useVideoPlayback } from "@/contexts/VideoPlaybackContext";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useAutoReward } from "@/hooks/useAutoReward";
import { useAuth } from "@/hooks/useAuth";
import { parseChapters, getCurrentChapter, type Chapter } from "@/lib/parseChapters";

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  title: string;
  description?: string;
  onEnded?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onAmbientColor?: (color: string | null) => void;
  isTheaterMode?: boolean;
  onTheaterToggle?: () => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const PLAYER_SETTINGS_KEY = "funplay_player_settings";

interface PlayerSettings {
  volume: number;
  playbackSpeed: number;
  autoplay: boolean;
  muted: boolean;
}

const defaultSettings: PlayerSettings = {
  volume: 1,
  playbackSpeed: 1,
  autoplay: true,
  muted: false,
};

export function EnhancedVideoPlayer({
  videoUrl,
  videoId,
  title,
  description,
  onEnded,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onPlayStateChange,
  onTimeUpdate,
  onAmbientColor,
  isTheaterMode,
  onTheaterToggle,
}: EnhancedVideoPlayerProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ambientIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  const loadSettings = (): PlayerSettings => {
    try {
      const saved = localStorage.getItem(PLAYER_SETTINGS_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  };

  const [settings, setSettings] = useState<PlayerSettings>(loadSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [viewRewarded, setViewRewarded] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(() => {
    try { return localStorage.getItem('funplay_ambient_mode') === 'true'; } catch { return false; }
  });
  const [hoveredChapterIdx, setHoveredChapterIdx] = useState<number | null>(null);
  const lastTimeUpdateRef = useRef(0);
  const accumulatedWatchTimeRef = useRef(0);

  // Parse chapters from description
  const chapters = useMemo(() => parseChapters(description), [description]);

  const { 
    session, 
    setAutoplay, 
    setShuffle, 
    setRepeat, 
    updateProgress,
    isAutoplayEnabled 
  } = useVideoPlayback();

  const { updateWatchProgress } = useWatchHistory();
  const { awardViewReward } = useAutoReward();
  const { user } = useAuth();

  // Track continuous watch time and award view reward using accumulated real watch time
  useEffect(() => {
    const checkViewReward = async () => {
      const video = videoRef.current;
      if (!video || viewRewarded || !user || !videoId) return;
      const dur = video.duration;
      if (!dur || dur <= 0) return;

      if (accumulatedWatchTimeRef.current >= dur * 0.3) {
        setViewRewarded(true);
        const result = await awardViewReward(videoId, { actualWatchTime: accumulatedWatchTimeRef.current });
        if (result.success) {
          console.log('[Desktop Reward] View reward awarded:', result.amount);
        }
      }
    };

    if (isPlaying) {
      const interval = setInterval(() => {
        checkViewReward();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, viewRewarded, user, videoId, awardViewReward]);

  // Reset reward state when video changes
  useEffect(() => {
    setViewRewarded(false);
    accumulatedWatchTimeRef.current = 0;
    lastTimeUpdateRef.current = 0;
  }, [videoId]);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<PlayerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Initialize video with settings
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = settings.volume;
    video.muted = settings.muted;
    video.playbackRate = settings.playbackSpeed;
  }, [videoUrl]);

  // Apply playback speed when settings change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = settings.playbackSpeed;
    }
  }, [settings.playbackSpeed]);

  // Auto-play on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !settings.autoplay) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (e) {
        console.log("Autoplay prevented:", e);
      }
    };

    playVideo();
  }, [videoUrl, settings.autoplay]);

  // Progress tracking (save every 5 seconds)
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && isPlaying) {
        updateProgress(videoRef.current.currentTime * 1000);
        updateWatchProgress(videoId, videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, updateProgress, updateWatchProgress, videoId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          seekRelative(-5);
          break;
        case "arrowright":
          e.preventDefault();
          seekRelative(5);
          break;
        case "j":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "l":
          e.preventDefault();
          seekRelative(10);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
          e.preventDefault();
          onTheaterToggle?.();
          break;
        case "arrowup":
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          const percent = parseInt(e.key) * 10;
          video.currentTime = (duration * percent) / 100;
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [duration, onTheaterToggle]);

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

  // Event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const now = video.currentTime;
      if (lastTimeUpdateRef.current > 0) {
        const delta = now - lastTimeUpdateRef.current;
        if (delta > 0 && delta <= 2) {
          accumulatedWatchTimeRef.current += delta;
        }
      }
      lastTimeUpdateRef.current = now;
      setCurrentTime(now);
      setShowEndScreen(false);
      onTimeUpdate?.(now, video.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    updateProgress(duration * 1000);
    
    if (isAutoplayEnabled && hasNext) {
      onEnded?.();
    } else {
      setShowEndScreen(true);
    }
  };

  // Control functions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      updateProgress(video.currentTime * 1000);
    } else {
      video.play();
      setShowEndScreen(false);
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, Math.min(time, duration));
      setShowEndScreen(false);
    }
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    }
  };

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
    saveSettings({ volume: newVolume, muted: false });
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = false;
    }
  };

  const setVolume = (value: number) => {
    saveSettings({ volume: value, muted: value === 0 });
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

  const toggleMute = () => {
    const newMuted = !settings.muted;
    saveSettings({ muted: newMuted });
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const setPlaybackSpeed = (speed: number) => {
    saveSettings({ playbackSpeed: speed });
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error("Fullscreen error:", e);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (e) {
      console.error("PiP error:", e);
    }
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      seekTo(0);
    } else if (onPrevious) {
      onPrevious();
    }
  };

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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
    if (!canvasRef.current) canvasRef.current = canvas as any;
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
        // CORS or other errors - silently ignore
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

  // Current chapter for display
  const currentChapter = useMemo(
    () => getCurrentChapter(chapters, currentTime),
    [chapters, currentTime]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group bg-black rounded-xl overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "aspect-video",
        // Hide cursor when controls are hidden and video is playing
        !showControls && isPlaying && "cursor-none"
      )}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Hidden canvas for ambient color sampling */}
      <canvas ref={canvasRef} className="hidden" width={4} height={4} />

      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        }}
        playsInline
      />

      {/* Close button - Top left, visible on hover */}
      <div className={cn(
        "absolute top-4 left-4 z-30 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              videoRef.current.pause();
            }
            navigate('/');
          }}
          className="h-10 w-10 text-white bg-black/50 hover:bg-red-500/40 rounded-full backdrop-blur-sm transition-all duration-200"
          title="Đóng video"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* End Screen */}
      {showEndScreen && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
          <p className="text-white text-lg font-semibold">Video đã kết thúc</p>
          <div className="flex gap-3">
            <Button
              onClick={() => seekTo(0)}
              variant="secondary"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Phát lại
            </Button>
            {hasNext && (
              <Button
                onClick={onNext}
                className="gap-2 bg-cosmic-cyan hover:bg-cosmic-cyan/80"
              >
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading/Buffering indicator */}
      {!isPlaying && currentTime === 0 && duration === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cosmic-cyan/30 border-t-cosmic-cyan rounded-full animate-spin" />
        </div>
      )}

      {/* Play/Pause overlay on click */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
          !isPlaying && showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Play className="h-10 w-10 text-white ml-1" />
        </div>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Bottom gradient only */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Bottom controls */}
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2">
          {/* Progress bar */}
          <div className="group/progress relative h-1 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all">
            {/* Buffered progress */}
            <div
              className="absolute h-full bg-white/40 rounded-full"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            {/* Played progress */}
            <div
              className="absolute h-full bg-cosmic-cyan rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Chapter markers */}
            {chapters.length > 0 && duration > 0 && chapters.map((chapter, idx) => (
              idx > 0 && (
                <div
                  key={idx}
                  className="absolute top-0 h-full w-0.5 bg-white/70 z-10"
                  style={{ left: `${(chapter.time / duration) * 100}%` }}
                />
              )
            ))}
            {/* Slider */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onMouseMove={(e) => {
                if (chapters.length === 0 || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const hoverTime = percent * duration;
                let found = -1;
                for (let i = chapters.length - 1; i >= 0; i--) {
                  if (hoverTime >= chapters[i].time) { found = i; break; }
                }
                setHoveredChapterIdx(found >= 0 ? found : null);
              }}
              onMouseLeave={() => setHoveredChapterIdx(null)}
            />
            {/* Thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-cosmic-cyan rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity z-10"
              style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
            />
            {/* Chapter tooltip on hover */}
            {hoveredChapterIdx !== null && chapters[hoveredChapterIdx] && (
              <div
                className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-30"
                style={{ left: `${(chapters[hoveredChapterIdx].time / duration) * 100}%` }}
              >
                {chapters[hoveredChapterIdx].title}
              </div>
            )}
          </div>

          {/* Current chapter label */}
          {currentChapter && chapters.length > 0 && (
            <div className="text-white/70 text-xs truncate max-w-[200px]">
              {currentChapter.title}
            </div>
          )}

          {/* Control buttons - YouTube layout */}
          <div className="flex items-center justify-between">
            {/* Left controls: Play/Pause, Prev*, Next*, Volume, Time */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>

              {/* Previous - only when queue exists */}
              {hasPrevious && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
              )}

              {/* Next - only when queue exists */}
              {hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={onNext}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {settings.muted || settings.volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200">
                  <Slider
                    value={[settings.muted ? 0 : settings.volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => setVolume(v)}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Time display */}
              <span className="text-white text-sm ml-2 hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls: Settings, PiP, Theater, Fullscreen */}
            <div className="flex items-center gap-1">
              {/* Settings - contains Speed, Shuffle, Loop, Ambient, Autoplay */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Playback Speed */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Tốc độ phát</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {settings.playbackSpeed}x
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <DropdownMenuItem
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className="flex items-center justify-between"
                        >
                          <span>{speed === 1 ? "Bình thường" : `${speed}x`}</span>
                          {settings.playbackSpeed === speed && (
                            <Check className="h-4 w-4" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Shuffle - moved from overlay button into Settings */}
                  <DropdownMenuItem
                    onClick={() => setShuffle(!session?.shuffle)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4" />
                      Phát ngẫu nhiên
                    </span>
                    {session?.shuffle && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>

                  {/* Loop */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Lặp lại</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {session?.repeat === "off" ? "Tắt" : session?.repeat === "all" ? "Tất cả" : "Một"}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setRepeat("off")}>
                        <span>Tắt</span>
                        {session?.repeat === "off" && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRepeat("all")}>
                        <span>Lặp tất cả</span>
                        {session?.repeat === "all" && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRepeat("one")}>
                        <span>Lặp một video</span>
                        {session?.repeat === "one" && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Ambient Mode */}
                  <DropdownMenuItem
                    onClick={() => {
                      const newVal = !ambientEnabled;
                      setAmbientEnabled(newVal);
                      localStorage.setItem('funplay_ambient_mode', String(newVal));
                      if (!newVal) onAmbientColor?.(null);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Chế độ ánh sáng
                    </span>
                    {ambientEnabled && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Autoplay */}
                  <DropdownMenuItem
                    onClick={() => {
                      const newAutoplay = !settings.autoplay;
                      saveSettings({ autoplay: newAutoplay });
                      setAutoplay(newAutoplay);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>Tự động phát</span>
                    {settings.autoplay && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Picture-in-Picture */}
              {document.pictureInPictureEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 hover:bg-white/20 hidden sm:flex ${
                    isPiPActive ? "text-cosmic-cyan" : "text-white"
                  }`}
                  onClick={togglePiP}
                >
                  <PictureInPicture2 className="h-5 w-5" />
                </Button>
              )}

              {/* Theater mode - inside player */}
              {onTheaterToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 hover:bg-white/20 hidden lg:flex ${
                    isTheaterMode ? "text-cosmic-cyan" : "text-white"
                  }`}
                  onClick={onTheaterToggle}
                  title={isTheaterMode ? "Chế độ mặc định (t)" : "Chế độ rạp phim (t)"}
                >
                  <RectangleHorizontal className="h-5 w-5" />
                </Button>
              )}

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile time display */}
      <div className="absolute top-4 right-4 sm:hidden">
        <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
