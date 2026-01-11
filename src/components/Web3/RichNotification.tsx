import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useClaimNotificationSound } from "@/hooks/useClaimNotificationSound";

interface RichNotificationProps {
  show: boolean;
  amount: string;
  token: string;
  count: number;
  onClose: () => void;
  userId?: string;
}

export const RichNotification = ({ show, amount, token, count, onClose, userId }: RichNotificationProps) => {
  const { getClaimSoundUrl } = useClaimNotificationSound();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Kill ALL voice synthesis immediately on mount and continuously
  useEffect(() => {
    const killVoice = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
    killVoice();
    const interval = setInterval(killVoice, 100); // Kill voice every 100ms
    return () => clearInterval(interval);
  }, []);

  // Happy jumping effect - move notification around the screen
  useEffect(() => {
    if (!show) return;

    const jumpInterval = setInterval(() => {
      const maxX = window.innerWidth - 400; // notification width approx
      const maxY = window.innerHeight - 150; // notification height approx
      
      const newX = Math.random() * Math.max(0, maxX);
      const newY = Math.random() * Math.max(0, maxY);
      
      setPosition({ x: newX, y: newY });
    }, 1500); // Jump every 1.5 seconds

    return () => clearInterval(jumpInterval);
  }, [show]);

  useEffect(() => {
    if (show) {
      // FORCE KILL all voice synthesis - NO VOICE AT ALL
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
      }

      // Play notification sound IMMEDIATELY - sử dụng nhạc cố định từ hệ thống
      const soundUrl = getClaimSoundUrl();
      const notificationAudio = new Audio(soundUrl);
      notificationAudio.volume = 0.6;
      notificationAudio.loop = true;
      
      // Play immediately without delay
      notificationAudio.play().catch(err => console.error("Error playing notification sound:", err));

      // Keep killing voice repeatedly during notification display
      const voiceKillInterval = setInterval(() => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }, 50);

      // Trigger massive confetti celebration
      const duration = 10000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(confettiInterval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        confetti({
          ...defaults,
          particleCount: particleCount / 2,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFFFFF', '#FFD700', '#00FF00'],
          shapes: ['star'],
        });
      }, 250);

      // Auto close after 10 seconds
      const timer = setTimeout(() => {
        clearInterval(confettiInterval);
        clearInterval(voiceKillInterval);
        if (notificationAudio) {
          notificationAudio.pause();
          notificationAudio.currentTime = 0;
        }
        onClose();
      }, 10000);

      return () => {
        clearTimeout(timer);
        clearInterval(confettiInterval);
        clearInterval(voiceKillInterval);
        if (notificationAudio) {
          notificationAudio.pause();
          notificationAudio.currentTime = 0;
        }
        // Force kill voice on cleanup
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [show, onClose, getClaimSoundUrl]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: position.x,
            y: position.y,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
            mass: 0.5,
            duration: 0.15,
          }}
          className="fixed top-4 left-4 p-4 rounded-2xl shadow-2xl overflow-hidden flex items-center gap-3"
          style={{
            zIndex: 99999,
            background: "white",
            border: "4px solid transparent",
            backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #00FFFF, #0000FF, #9400D3)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "0 0 60px rgba(255, 0, 0, 0.7), 0 0 80px rgba(255, 127, 0, 0.6), 0 0 100px rgba(255, 255, 0, 0.5), 0 0 120px rgba(0, 255, 0, 0.4), 0 0 140px rgba(0, 0, 255, 0.3)",
          }}
        >
          {/* Bouncing animation wrapper */}
          <motion.div
            animate={{
              y: [0, -10, 0, -5, 0],
              rotate: [-2, 2, -2, 2, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 0.2,
              ease: "easeInOut",
            }}
            className="flex items-center gap-3"
          >
            {/* Pulsing Rainbow CAMLY Coin Icon */}
            <motion.img
              src="/images/camly-coin.png"
              alt="CAMLY COIN"
              className="w-12 h-12 rounded-full relative z-10"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
                filter: [
                  "drop-shadow(0 0 20px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 127, 0, 0.6))",
                  "drop-shadow(0 0 20px rgba(255, 255, 0, 0.8)) drop-shadow(0 0 40px rgba(0, 255, 0, 0.6))",
                  "drop-shadow(0 0 20px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(0, 0, 255, 0.6))",
                  "drop-shadow(0 0 20px rgba(255, 0, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 0, 0, 0.6))",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                boxShadow: "0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 165, 0, 0.8), 0 0 120px rgba(255, 255, 0, 0.6)",
              }}
            />
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 relative z-10">
                <motion.span
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="font-black text-3xl"
                  style={{
                    background: "linear-gradient(90deg, #FFD700 0%, #FFC300 30%, #FFB000 60%, #FF9500 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontWeight: 900,
                  }}
                >
                  RICH
                </motion.span>
                <motion.span
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="font-black text-xl"
                  style={{
                    background: "linear-gradient(90deg, #FFD700 0%, #FFC300 30%, #FFB000 60%, #FF9500 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontWeight: 900,
                  }}
                >
                  +{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {token}
                </motion.span>
              </div>
              
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs font-bold mt-1 relative z-10"
                style={{
                  background: "linear-gradient(90deg, #FFD700 0%, #FFC300 30%, #FFB000 60%, #FF9500 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 900,
                }}
              >
                💰 Chúc mừng! Bạn vừa nhận được tiền! 💎
              </motion.p>
            </div>
          </motion.div>
          
          {/* Golden Fireworks effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 40 + Math.random() * 20;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                    x: [0, Math.cos(angle) * distance],
                    y: [0, Math.sin(angle) * distance],
                    background: [
                      "#FF0000", // Red
                      "#FF7F00", // Orange
                      "#FFFF00", // Yellow
                      "#00FF00", // Green
                      "#00FFFF", // Cyan
                      "#0000FF", // Blue
                      "#9400D3", // Violet
                      "#FF0000", // Back to Red
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    boxShadow: "0 0 20px currentColor, 0 0 40px currentColor",
                  }}
                />
              );
            })}
            {/* Diamond sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`diamond-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, Math.random() * 60 - 30],
                  y: [0, Math.random() * 60 - 30],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
                className="absolute w-1.5 h-1.5"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: '#FFFFFF',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  boxShadow: "0 0 10px #FFD700, 0 0 20px #FFFFFF",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
