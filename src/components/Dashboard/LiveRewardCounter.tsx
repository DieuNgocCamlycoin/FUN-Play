import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";

interface LiveRewardCounterProps {
  totalRewards: number;
  className?: string;
}

export const LiveRewardCounter = ({ totalRewards, className = "" }: LiveRewardCounterProps) => {
  const [displayValue, setDisplayValue] = useState(totalRewards);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rewardDiff, setRewardDiff] = useState(0);

  useEffect(() => {
    if (totalRewards !== displayValue) {
      const diff = totalRewards - displayValue;
      setRewardDiff(diff);
      setIsAnimating(true);

      // Animate counting up
      const duration = 1500;
      const steps = 30;
      const stepValue = diff / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(totalRewards);
          clearInterval(interval);
          setTimeout(() => setIsAnimating(false), 500);
        } else {
          setDisplayValue(prev => Math.round(prev + stepValue));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [totalRewards]);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="flex items-center gap-2"
        animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={isAnimating ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Coins className="w-6 h-6 text-[#FFD700]" />
        </motion.div>
        <span className="text-2xl font-black bg-gradient-to-r from-[#FFD700] to-[#FF9500] bg-clip-text text-transparent">
          {displayValue.toLocaleString()}
        </span>
      </motion.div>

      <AnimatePresence>
        {isAnimating && rewardDiff > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: -10, x: 40 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute top-0 right-0 flex items-center gap-1 text-green-500 font-bold text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            +{rewardDiff.toLocaleString()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
