import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "valentine-music-muted";
const POS_KEY = "valentine-music-pos";
const SESSION_KEY = "valentine-music-session";

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

export const ValentineMusicButton = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const audioUnlockedRef = useRef(false);
  const userMutedRef = useRef(false);
  const isMobile = useIsMobile();
  const constraintsRef = useRef<HTMLDivElement | null>(null);

  const initialPos = getSavedPos(isMobile);
  const motionX = useMotionValue(initialPos.x);
  const motionY = useMotionValue(initialPos.y);

  // Session-based mute reset: clear mute pref on new session/reload
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

    // Tier 1: Try unmuted
    audio.muted = false;
    audio.play()
      .then(() => {
        setIsPlaying(true);
        setShowUnmuteHint(false);
        audioUnlockedRef.current = true;
        localStorage.setItem(STORAGE_KEY, "false");
      })
      .catch(() => {
        // Tier 2: Try muted autoplay
        audio.muted = true;
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setShowUnmuteHint(true);
            // Don't set audioUnlockedRef — we still need user tap to unmute
          })
          .catch(() => {
            // Tier 3: wait for user interaction (handled by interaction listeners)
          });
      });
  }, []);

  // Try to play on mount + delayed retry
  useEffect(() => {
    tryPlay();
    const timer = setTimeout(tryPlay, 1500);
    return () => clearTimeout(timer);
  }, [tryPlay]);

  // Interaction-based fallback: keep retrying on every user interaction until audio unlocks
  useEffect(() => {
    if (userMutedRef.current) return;

    const handler = () => {
      const audio = audioRef.current;
      if (!audio || audioUnlockedRef.current) {
        removeListeners();
        return;
      }
      audio.muted = false;
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
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("pointerdown", handler);
    };

    document.addEventListener("click", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("pointerdown", handler);

    return removeListeners;
  }, []);

  // Visibility handler: resume when user returns to tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !userMutedRef.current) {
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

    // If playing muted, unmute on tap
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

  const buttonSize = isMobile ? 48 : 44;

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/valentine-bg.mp3"
        loop
        preload="auto"
        style={{ display: "none" }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onCanPlayThrough={() => tryPlay()}
      />
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[49] pointer-events-none"
      />
      <AnimatePresence>
        <motion.button
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          dragListener={true}
          onTap={toggle}
          onDragEnd={() => {
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
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isPlaying
                ? { repeat: Infinity, duration: 4, ease: "linear" }
                : { duration: 0.3 }
            }
            style={{ opacity: isPlaying ? 1 : 0.6 }}
          />
          {/* Unmute hint badge */}
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
      </AnimatePresence>
    </>
  );
};
