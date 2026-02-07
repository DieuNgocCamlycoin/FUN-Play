import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface DonationCelebrationProps {
  amount: number;
  senderName: string;
  onClose: () => void;
}

export const DonationCelebration = ({ amount, senderName, onClose }: DonationCelebrationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: randomInRange(0.1, 0.5),
        },
        colors: ["#00E7FF", "#7A2BFF", "#FF00E5", "#FFD700"],
      });
    }, 250);

    // Auto close after 5 seconds
    const timeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm mx-4"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Main Card */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 via-[hsl(var(--cosmic-purple))]/20 to-[hsl(var(--cosmic-magenta))]/20 backdrop-blur-xl border-2 border-[hsl(var(--cosmic-gold))]/50 shadow-[0_0_60px_rgba(255,215,0,0.3)]">
              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div
                  className="absolute inset-0 animate-spin-slow"
                  style={{
                    background: "conic-gradient(from 0deg, hsl(var(--cosmic-cyan)), hsl(var(--cosmic-purple)), hsl(var(--cosmic-magenta)), hsl(var(--cosmic-gold)), hsl(var(--cosmic-cyan)))",
                    animationDuration: "3s",
                    opacity: 0.3,
                  }}
                />
              </div>

              {/* Content */}
              <div className="relative text-center">
                {/* Icon with Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative inline-block mb-4"
                >
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--cosmic-gold))] blur-xl opacity-50" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--cosmic-gold))] to-[hsl(var(--cosmic-magenta))] flex items-center justify-center">
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                {/* Sparkles */}
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute top-4 left-4"
                >
                  <Sparkles className="w-6 h-6 text-[hsl(var(--cosmic-gold))]" />
                </motion.div>
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  className="absolute top-4 right-4"
                >
                  <Sparkles className="w-6 h-6 text-[hsl(var(--cosmic-cyan))]" />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--cosmic-gold))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-cyan))] bg-clip-text text-transparent mb-2">
                  🎉 Bạn nhận được quà!
                </h2>

                {/* Amount */}
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-4xl font-bold text-[hsl(var(--cosmic-gold))] mb-2"
                >
                  {amount.toLocaleString()} CAMLY
                </motion.p>

                {/* Sender */}
                <p className="text-foreground">
                  từ <span className="font-semibold text-[hsl(var(--cosmic-cyan))]">{senderName}</span>
                </p>

                {/* Message */}
                <p className="text-sm text-muted-foreground mt-3">
                  💖 Cảm ơn vì đã lan tỏa ánh sáng!
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
