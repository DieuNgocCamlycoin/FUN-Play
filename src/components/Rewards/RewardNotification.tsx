import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface RewardNotificationProps {
  amount: number;
  type: "VIEW" | "LIKE" | "COMMENT" | "SHARE";
  show: boolean;
  onClose: () => void;
}

const REWARD_LABELS = {
  VIEW: "Xem video",
  LIKE: "Thích video",
  COMMENT: "Bình luận",
  SHARE: "Chia sẻ",
};

export const RewardNotification = ({ amount, type, show, onClose }: RewardNotificationProps) => {
  useEffect(() => {
    if (show) {
      // Trigger mini confetti
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.3, x: 0.5 },
        colors: ['#FFD700', '#FFA500', '#00E7FF'],
        zIndex: 9999,
      });

      // Auto close after 3 seconds
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: "spring", damping: 15 }}
          className="fixed top-20 right-4 z-[9999] pointer-events-none"
        >
          <div className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-yellow-500/60 rounded-xl p-4 shadow-[0_0_30px_rgba(255,215,0,0.5)] min-w-[280px]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Coins className="w-10 h-10 text-yellow-400 animate-pulse" />
                <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">
                  {REWARD_LABELS[type]}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-yellow-400">
                    +{amount.toFixed(3)}
                  </span>
                  <span className="text-sm text-yellow-500">CAMLY</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
