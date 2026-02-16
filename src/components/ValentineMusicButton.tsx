import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Slider } from "@/components/ui/slider";

const STORAGE_KEY = "valentine-music-muted";
const POS_KEY = "valentine-music-pos";
const SESSION_KEY = "valentine-music-session";
const VOLUME_KEY = "valentine-music-volume";

const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD = 5;
const SLIDER_HIDE_MS = 3000;

const getDefaultPos = (isMobile: boolean) => {
  if (isMobile) return { x: 16, y: window.innerHeight - 112 };
  return { x: window.innerWidth - 60, y: window.innerHeight - 68 };
};

const getSavedPos = (isMobile: boolean) => {
  try {
    const saved = localStorage.getItem(POS_KEY);
    if (saved) {
      const pos = JSON.parse(saved);
      return {
        x: Math.min(Math.max(0, pos.x), window.innerWidth - 48),
        y: Math.min(Math.max(0, pos.y), window.innerHeight - 48),
      };
    }
  } catch {}
  return getDefaultPos(isMobile);
};

const getSavedVolume = (): number => {
  try {
    const v = localStorage.getItem(VOLUME_KEY);
    if (v !== null) return Math.min(100, Math.max(0, Number(v)));
  } catch {}
  return 50;
};

export const ValentineMusicButton = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(getSavedVolume);
  const [sliderPos, setSliderPos] = useState({ x: 0, y: 0 });

  const volumeRef = useRef(volume);
  const audioUnlockedRef = useRef(false);
  const userMutedRef = useRef(false);
  const isMobile = useIsMobile();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const initialPos = getSavedPos(isMobile);
  const motionX = useMotionValue(initialPos.x);
  const motionY = useMotionValue(initialPos.y);

  // Keep volumeRef in sync
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  // Auto-hide volume slider
  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowVolumeSlider(false), SLIDER_HIDE_MS);
  }, []);

  const openVolumeSlider = useCallback(() => {
    setSliderPos({ x: motionX.get(), y: motionY.get() });
    setShowVolumeSlider(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowVolumeSlider(false), SLIDER_HIDE_MS);
  }, [motionX, motionY]);

  const closeVolumeSlider = useCallback(() => {
    setShowVolumeSlider(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const toggleVolumeSlider = useCallback(() => {
    if (showVolumeSlider) {
      closeVolumeSlider();
    } else {
      openVolumeSlider();
    }
  }, [showVolumeSlider, openVolumeSlider, closeVolumeSlider]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Session-based mute reset
  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    userMutedRef.current = localStorage.getItem(STORAGE_KEY) === "true";
  }, []);

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || userMutedRef.current || audioUnlockedRef.current) return;

    audio.volume = volumeRef.current / 100;
    audio.muted = false;
    audio.play()
      .then(() => {
        setIsPlaying(true);
        setShowUnmuteHint(false);
        audioUnlockedRef.current = true;
        localStorage.setItem(STORAGE_KEY, "false");
      })
      .catch(() => {
        audio.muted = true;
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setShowUnmuteHint(true);
          })
          .catch(() => {});
      });
  }, []); // No volume dependency — uses volumeRef

  useEffect(() => {
    tryPlay();
    const timer = setTimeout(tryPlay, 1500);
    return () => clearTimeout(timer);
  }, [tryPlay]);

  // Interaction-based fallback — registers once
  useEffect(() => {
    if (userMutedRef.current) return;

    const handler = () => {
      const audio = audioRef.current;
      if (!audio || audioUnlockedRef.current) {
        removeListeners();
        return;
      }
      audio.muted = false;
      audio.volume = volumeRef.current / 100;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setShowUnmuteHint(false);
          audioUnlockedRef.current = true;
          localStorage.setItem(STORAGE_KEY, "false");
          removeListeners();
        })
        .catch(() => {});
    };

    const removeListeners = () => {
      document.removeEventListener("pointerdown", handler);
    };

    document.addEventListener("pointerdown", handler);

    return removeListeners;
  }, []); // No volume dependency — uses volumeRef

  // Visibility handler
  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      setIsTabVisible(visible);
      if (visible && !userMutedRef.current) {
        const audio = audioRef.current;
        if (audio && audio.paused) {
          tryPlay();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [tryPlay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.muted && !audio.paused) {
      audio.muted = false;
      setShowUnmuteHint(false);
      audioUnlockedRef.current = true;
      localStorage.setItem(STORAGE_KEY, "false");
      userMutedRef.current = false;
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setShowUnmuteHint(false);
      localStorage.setItem(STORAGE_KEY, "true");
      userMutedRef.current = true;
    } else {
      audio.muted = false;
      audio.volume = volumeRef.current / 100;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setShowUnmuteHint(false);
          audioUnlockedRef.current = true;
          localStorage.setItem(STORAGE_KEY, "false");
          userMutedRef.current = false;
        })
        .catch(() => {});
    }
  };

  // Long-press with drag threshold
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isLongPressRef.current = false;
    isDraggingRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };

    longPressTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        isLongPressRef.current = true;
        toggleVolumeSlider();
      }
    }, LONG_PRESS_MS);
  }, [toggleVolumeSlider]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current || isDraggingRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    pointerStartRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    resetHideTimer();
  }, [resetHideTimer]);

  const buttonSize = isMobile ? 48 : 44;

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/valentine-bg.mp3"
        loop
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[49] pointer-events-none"
      />

      {/* Volume Slider */}
      <AnimatePresence>
        {showVolumeSlider && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[51] flex items-center justify-center"
            style={{
              left: sliderPos.x + buttonSize / 2 - 16,
              top: sliderPos.y - (isMobile ? 140 : 130),
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <div className="bg-black/70 backdrop-blur-md rounded-full px-3 py-4 flex flex-col items-center gap-2 shadow-lg border border-white/10">
              <span className="text-white text-[10px] font-medium">{volume}%</span>
              <div className="h-24">
                <Slider
                  orientation="vertical"
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  min={0}
                  step={1}
                  className="h-full cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-pink-400 [&_[role=slider]]:bg-white [&_span[data-orientation=vertical]>span]:bg-pink-400"
                />
              </div>
              <span className="text-white/60 text-[10px]">🔊</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onTap={() => {
          if (!isLongPressRef.current && !isDraggingRef.current) toggle();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDragEnd={() => {
          handlePointerUp();
          localStorage.setItem(POS_KEY, JSON.stringify({
            x: motionX.get(),
            y: motionY.get(),
          }));
        }}
        style={{
          x: motionX,
          y: motionY,
          position: "fixed",
          top: 0,
          left: 0,
          width: buttonSize,
          height: buttonSize,
          boxShadow: isPlaying
            ? "0 0 18px 4px rgba(236,72,153,0.5), 0 0 40px 8px rgba(168,85,247,0.3)"
            : "0 0 8px 2px rgba(236,72,153,0.2)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        className="z-50 rounded-full p-1 cursor-grab active:cursor-grabbing focus:outline-none"
        aria-label={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
        title={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
      >
        <motion.img
          src="/images/icon-music-valentine.png"
          alt="Music toggle"
          className="w-full h-full rounded-full object-cover pointer-events-none"
          animate={isPlaying && isTabVisible ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isPlaying && isTabVisible
              ? { repeat: Infinity, duration: 4, ease: "linear" }
              : { duration: 0.3 }
          }
          style={{ opacity: isPlaying ? 1 : 0.6 }}
        />
        {showUnmuteHint && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span className="text-white text-[10px] font-bold">🔊</span>
          </motion.div>
        )}
      </motion.button>
    </>
  );
};
