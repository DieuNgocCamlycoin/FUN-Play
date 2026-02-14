import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "valentine-music-muted";
const POS_KEY = "valentine-music-pos";

const getDefaultPos = (isMobile: boolean) => {
  if (isMobile) return { x: 16, y: window.innerHeight - 112 };
  return { x: window.innerWidth - 60, y: window.innerHeight - 68 };
};

const getSavedPos = (isMobile: boolean) => {
  try {
    const saved = localStorage.getItem(POS_KEY);
    if (saved) {
      const pos = JSON.parse(saved);
      // Clamp to current viewport
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const isMobile = useIsMobile();
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const constraintsRef = useRef<HTMLDivElement | null>(null);

  const initialPos = getSavedPos(isMobile);
  const motionX = useMotionValue(initialPos.x);
  const motionY = useMotionValue(initialPos.y);

  const isMutedStored = () => localStorage.getItem(STORAGE_KEY) === "true";

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isMutedStored()) return;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMutedStored()) tryPlay();
  }, [tryPlay]);

  useEffect(() => {
    if (hasInteracted || isMutedStored()) return;
    const handler = () => {
      setHasInteracted(true);
      tryPlay();
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
    document.addEventListener("click", handler, { once: true });
    document.addEventListener("touchstart", handler, { once: true });
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [hasInteracted, tryPlay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        localStorage.setItem(STORAGE_KEY, "false");
      }).catch(() => {});
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
      />
      {/* Full-screen drag constraints container */}
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
          onDragStart={() => {
            isDraggingRef.current = false;
          }}
          onDrag={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={() => {
            localStorage.setItem(POS_KEY, JSON.stringify({
              x: motionX.get(),
              y: motionY.get(),
            }));
          }}
          onPointerUp={() => {
            if (!isDraggingRef.current) {
              toggle();
            }
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
          className="z-50 rounded-full p-1 cursor-grab active:cursor-grabbing focus:outline-none touch-none"
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
        </motion.button>
      </AnimatePresence>
    </>
  );
};
