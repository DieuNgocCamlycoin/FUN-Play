import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface RichNotificationProps {
  show: boolean;
  amount: string;
  token: string;
  count: number;
  onClose: () => void;
}

export const RichNotification = ({ show, amount, token, count, onClose }: RichNotificationProps) => {
  useEffect(() => {
    if (show) {
      // Play cute baby Aliens Angel voice saying "RICH RICH RICH"
      const speakNotification = () => {
        const utterance = new SpeechSynthesisUtterance("RICH RICH RICH");
        utterance.pitch = 2.0; // Very high pitch for cute baby angel voice
        utterance.rate = 0.9; // Slightly slower for cuteness
        utterance.volume = 1;
        utterance.lang = 'en-US'; // English for "RICH"
        window.speechSynthesis.speak(utterance);
      };
      speakNotification();

      // Trigger massive confetti celebration
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Golden confetti from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        // Golden confetti from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        // Sparkles from center
        confetti({
          ...defaults,
          particleCount: particleCount / 2,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFFFFF', '#FFD700', '#00FF00'],
          shapes: ['star'],
        });
      }, 250);

      const timer = setTimeout(() => {
        clearInterval(interval);
        onClose();
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
          }}
          exit={{ opacity: 0, y: -50, scale: 0.5 }}
          className="fixed top-24 right-4 z-50 p-8 rounded-3xl shadow-2xl overflow-hidden flex items-center gap-6"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 230, 0.95))",
            backdropFilter: "blur(30px)",
            border: "3px solid transparent",
            backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #FFD700, #FFA500, #FFFF00, #FFD700)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 165, 0, 0.6), 0 0 140px rgba(255, 255, 0, 0.4)",
          }}
        >
          {/* Pulsing Rainbow CAMLY Coin Icon */}
          <motion.img
            src="/images/camly-coin.png"
            alt="CAMLY COIN"
            className="w-24 h-24 rounded-full relative z-10"
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
          
          <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 relative z-10">
            <motion.span
              animate={{
                scale: [1, 1.3, 1],
                textShadow: [
                  "0 0 20px #FFD700, 0 0 40px #FFA500",
                  "0 0 40px #FFD700, 0 0 80px #FFA500, 0 0 120px #FFFF00",
                  "0 0 20px #FFD700, 0 0 40px #FFA500",
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-black text-5xl"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500, #FFFF00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(255, 215, 0, 1))",
              }}
            >
              RICH
            </motion.span>
            <motion.span
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-black text-4xl"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFFF00, #FFA500)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))",
              }}
            >
              +{parseFloat(amount).toFixed(3)} {token}
            </motion.span>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base font-bold mt-3 relative z-10"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            💰✨ Chúc mừng! Bạn vừa nhận được tiền! 💎🎉
          </motion.p>
          </div>
          
          {/* Golden Fireworks effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => {
              const angle = (i / 20) * Math.PI * 2;
              const distance = 80 + Math.random() * 40;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                    x: [0, Math.cos(angle) * distance],
                    y: [0, Math.sin(angle) * distance],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    background: `linear-gradient(135deg, #FFD700, #FFA500, #FFFF00)`,
                    boxShadow: "0 0 15px #FFD700, 0 0 30px #FFA500",
                  }}
                />
              );
            })}
            {/* Diamond sparkles */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`diamond-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, Math.random() * 120 - 60],
                  y: [0, Math.random() * 120 - 60],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2"
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
