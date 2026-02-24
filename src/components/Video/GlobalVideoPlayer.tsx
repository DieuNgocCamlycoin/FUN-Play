import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  X, Maximize2, Minimize2, ChevronUp, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { VideoPlaceholder } from "./VideoPlaceholder";
import { cn } from "@/lib/utils";
import { isVideoWatchPage, extractVideoIdFromPath } from "@/lib/videoNavigation";
import { requestPlayback, onPauseRequest } from "@/lib/mediaSessionManager";

interface GlobalVideoState {
  videoId: string;
  videoUrl: string;
  title: string;
  thumbnailUrl?: string | null;
  channelName?: string;
  channelId?: string;
  currentTime: number;
  duration: number;
}

// Global state storage for persisting across navigations
let globalVideoState: GlobalVideoState | null = null;
let globalIsPlaying = false;
let globalVolume = 0.7;

export const getGlobalVideoState = () => globalVideoState;
export const setGlobalVideoState = (state: GlobalVideoState | null) => {
  globalVideoState = state;
};
export const setGlobalPlayingState = (playing: boolean) => {
  globalIsPlaying = playing;
};

export const GlobalVideoPlayer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [videoState, setVideoState] = useState<GlobalVideoState | null>(globalVideoState);
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const [volume, setVolume] = useState(globalVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [audioOnly, setAudioOnly] = useState(true); // Default to audio-only mode

  // Check if we're on the watch page for the current video
  const isOnWatchPage = isVideoWatchPage(location.pathname) && (() => {
    const legacyId = extractVideoIdFromPath(location.pathname);
    if (legacyId) return videoState?.videoId === legacyId;
    // New URL: detection is by global state matching (video is playing on current page)
    return true;
  })();

  // Hide player when on the same video's watch page - PAUSE trước khi ẩn
  useEffect(() => {
    if (isOnWatchPage) {
      // DỪNG video TRƯỚC khi ẩn - tránh âm thanh chạy ngầm
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      setIsVisible(false);
    } else if (globalVideoState) {
      setIsVisible(true);
    }
  }, [location.pathname, isOnWatchPage]);

  // Sync with global state on mount and route changes
  useEffect(() => {
    if (globalVideoState && !isOnWatchPage) {
      setVideoState(globalVideoState);
      setIsPlaying(globalIsPlaying);
      setIsVisible(true);
    }
  }, [location.pathname]);

  // Listen for custom events from Watch page
  useEffect(() => {
    const handleStartGlobalPlayback = (event: CustomEvent<GlobalVideoState>) => {
      globalVideoState = event.detail;
      globalIsPlaying = true;
      setVideoState(event.detail);
      setIsPlaying(true);
      setIsVisible(true);
      requestPlayback("global-video");
    };

    const handleStopGlobalPlayback = () => {
      globalVideoState = null;
      globalIsPlaying = false;
      setVideoState(null);
      setIsPlaying(false);
      setIsVisible(false);
    };

    const handleUpdateGlobalTime = (event: CustomEvent<{ currentTime: number; duration: number }>) => {
      if (globalVideoState) {
        globalVideoState.currentTime = event.detail.currentTime;
        globalVideoState.duration = event.detail.duration;
      }
    };

    window.addEventListener('startGlobalPlayback', handleStartGlobalPlayback as EventListener);
    window.addEventListener('stopGlobalPlayback', handleStopGlobalPlayback);
    window.addEventListener('updateGlobalTime', handleUpdateGlobalTime as EventListener);

    return () => {
      window.removeEventListener('startGlobalPlayback', handleStartGlobalPlayback as EventListener);
      window.removeEventListener('stopGlobalPlayback', handleStopGlobalPlayback);
      window.removeEventListener('updateGlobalTime', handleUpdateGlobalTime as EventListener);
    };
  }, []);

  // Handle video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoState) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (globalVideoState) {
        globalVideoState.currentTime = video.currentTime;
      }
    };
    const handleDurationChange = () => {
      setDuration(video.duration || 0);
      if (globalVideoState) {
        globalVideoState.duration = video.duration || 0;
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      globalIsPlaying = true;
    };
    const handlePause = () => {
      setIsPlaying(false);
      globalIsPlaying = false;
    };
    const handleEnded = () => {
      setIsPlaying(false);
      globalIsPlaying = false;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Set initial time and volume
    if (videoState.currentTime > 0) {
      video.currentTime = videoState.currentTime;
    }
    video.volume = volume;

    // Auto-play if was playing - chỉ khi KHÔNG ở trang Watch
    if (globalIsPlaying && !isOnWatchPage) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoState?.videoUrl]);

  // Update volume when changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      globalVolume = volume;
    }
  }, [volume]);

  // Listen for pause requests from other media sources
  useEffect(() => {
    return onPauseRequest("global-video", () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
        setIsPlaying(false);
        globalIsPlaying = false;
      }
    });
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      requestPlayback("global-video");
      video.play().catch(console.error);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = value[0];
    }
  }, []);

  const handleClose = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    globalVideoState = null;
    globalIsPlaying = false;
    setVideoState(null);
    setIsPlaying(false);
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('globalPlayerClosed'));
  }, []);

  const handleExpand = useCallback(async () => {
    if (videoState) {
      // Save current time before navigating
      if (globalVideoState && videoRef.current) {
        globalVideoState.currentTime = videoRef.current.currentTime;
      }
      const { getVideoPath } = await import("@/lib/videoNavigation");
      const path = await getVideoPath(videoState.videoId, `?t=${Math.floor(currentTime)}`);
      navigate(path);
    }
  }, [videoState, currentTime, navigate]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoState || !isVisible || isOnWatchPage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed z-50",
          isExpanded 
            ? "bottom-20 lg:bottom-4 right-4 w-[420px] max-w-[calc(100vw-2rem)]"
            : "bottom-20 lg:bottom-4 right-4 w-[360px] max-w-[calc(100vw-2rem)]"
        )}
      >
        <Card className="overflow-hidden border-primary/20 shadow-2xl shadow-primary/10 bg-slate-900/95 backdrop-blur-xl">
          <div className="relative">
            {/* Video or Thumbnail */}
            <div className={cn(
              "relative bg-black",
              isExpanded ? "aspect-video" : "h-0 overflow-hidden"
            )}>
              {!audioOnly && isExpanded && (
                <video
                  ref={videoRef}
                  src={videoState.videoUrl}
                  className="w-full h-full object-contain"
                  playsInline
                />
              )}
            </div>

            {/* Hidden audio element for audio-only mode */}
            {audioOnly && (
              <video
                ref={videoRef}
                src={videoState.videoUrl}
                className="hidden"
                playsInline
              />
            )}

            {/* Compact player bar */}
            <div className="p-3">
              {/* Header with track info */}
              <div className="flex items-center gap-3 mb-3">
                {/* Thumbnail */}
                <motion.div 
                  className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-primary/30 cursor-pointer"
                  onClick={handleExpand}
                  whileHover={{ scale: 1.05 }}
                  animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {videoState.thumbnailUrl ? (
                    <img 
                      src={videoState.thumbnailUrl} 
                      alt={videoState.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <VideoPlaceholder />
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                </motion.div>
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={handleExpand}>
                  <p className="text-xs text-primary mb-0.5">Đang phát</p>
                  <h4 className="text-sm font-semibold text-white truncate hover:text-primary transition-colors">
                    {videoState.title}
                  </h4>
                  {videoState.channelName && (
                    <p className="text-xs text-white/50 truncate">{videoState.channelName}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExpand}
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    title="Mở rộng"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration || 100}
                  step={1}
                  className="cursor-pointer [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-400 [&_[role=slider]]:to-amber-400 [&_.relative]:bg-white/20"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {/* Left: Mode toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioOnly(!audioOnly)}
                    className={cn(
                      "h-8 text-xs transition-all",
                      audioOnly 
                        ? "text-amber-400 bg-amber-400/10" 
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {audioOnly ? "🎵 Audio" : "🎬 Video"}
                  </Button>
                </div>

                {/* Center: Playback */}
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    onClick={togglePlay}
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </Button>
                </div>

                {/* Right: Volume */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                  >
                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  
                  <AnimatePresence>
                    {showVolumeSlider && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-800 rounded-lg shadow-xl"
                        onMouseLeave={() => setShowVolumeSlider(false)}
                      >
                        <Slider
                          value={[volume * 100]}
                          onValueChange={(v) => setVolume(v[0] / 100)}
                          max={100}
                          step={1}
                          orientation="vertical"
                          className="h-20"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
