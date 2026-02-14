import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "valentine-music-muted";

export const ValentineMusicButton = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const isMobile = useIsMobile();

  const isMutedStored = () => localStorage.getItem(STORAGE_KEY) === "true";

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isMutedStored()) return;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  // Auto-play on mount or after first interaction
  useEffect(() => {
    if (!isMutedStored()) {
      tryPlay();
    }
  }, [tryPlay]);

  // Listen for first user interaction to unlock autoplay
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
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
          onClick={toggle}
          className={`fixed z-50 rounded-full p-1 cursor-pointer focus:outline-none ${
            isMobile
              ? "bottom-20 left-4 w-12 h-12"
              : "bottom-6 right-6 w-11 h-11"
          }`}
          style={{
            boxShadow: isPlaying
              ? "0 0 18px 4px rgba(236,72,153,0.5), 0 0 40px 8px rgba(168,85,247,0.3)"
              : "0 0 8px 2px rgba(236,72,153,0.2)",
          }}
          aria-label={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
          title={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
        >
          <motion.img
            src="/images/icon-music-valentine.png"
            alt="Music toggle"
            className="w-full h-full rounded-full object-cover"
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
