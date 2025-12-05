import { motion } from "framer-motion";
import { Medal, Award, Crown, Gem, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

interface LuxuryHonobarProps {
  totalRewards: number;
  previousTotal?: number;
}

const ACHIEVEMENT_TIERS = [
  { name: "Bronze", threshold: 1_000_000, icon: Medal, color: "from-amber-600 to-orange-400", glow: "#cd7f32" },
  { name: "Silver", threshold: 3_000_000, icon: Award, color: "from-gray-300 to-slate-400", glow: "#c0c0c0" },
  { name: "Gold", threshold: 5_000_000, icon: Crown, color: "from-yellow-400 to-amber-500", glow: "#ffd700" },
  { name: "Diamond", threshold: 10_000_000, icon: Gem, color: "from-cyan-300 to-blue-400", glow: "#00e7ff" },
];

export const LuxuryHonobar = ({ totalRewards, previousTotal = 0 }: LuxuryHonobarProps) => {
  const hasTriggeredRankUp = useRef(false);

  const currentTier = [...ACHIEVEMENT_TIERS].reverse().find(t => totalRewards >= t.threshold);
  const nextTier = ACHIEVEMENT_TIERS.find(t => totalRewards < t.threshold);
  
  const prevTier = [...ACHIEVEMENT_TIERS].reverse().find(t => previousTotal >= t.threshold);

  // Check for rank up
  useEffect(() => {
    if (currentTier && prevTier && currentTier.threshold > prevTier.threshold && !hasTriggeredRankUp.current) {
      hasTriggeredRankUp.current = true;
      triggerRankUpCelebration();
    }
  }, [currentTier, prevTier]);

  const triggerRankUpCelebration = () => {
    // Play victory sound
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});

    // Full screen confetti
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const colors = ['#ffd700', '#ff00e5', '#00e7ff', '#7a2bff'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.8 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.8 },
        colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Fireworks
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
    }, 500);
  };

  const progress = nextTier 
    ? ((totalRewards - (currentTier?.threshold || 0)) / (nextTier.threshold - (currentTier?.threshold || 0))) * 100
    : 100;

  const TierIcon = currentTier?.icon || Medal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* 3D metallic gold border */}
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 25%, #ffd700 50%, #daa520 75%, #ffd700 100%)',
          padding: '3px',
        }}
      >
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[hsl(var(--cosmic-purple)/0.9)] to-black" />
      </div>

      {/* Floating star particles background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Sparkles className="w-3 h-3 text-[hsl(var(--cosmic-gold))]" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-6">
          {/* Current tier icon */}
          <motion.div
            className={`relative p-4 rounded-full bg-gradient-to-br ${currentTier?.color || 'from-gray-400 to-gray-600'}`}
            animate={{
              boxShadow: [
                `0 0 20px ${currentTier?.glow || '#666'}`,
                `0 0 40px ${currentTier?.glow || '#666'}`,
                `0 0 20px ${currentTier?.glow || '#666'}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <TierIcon className="w-10 h-10 text-white" />
          </motion.div>

          {/* Tier info */}
          <div className="flex-1">
            <motion.div
              className="text-3xl font-black"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #fff, #ffd700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(255,215,0,0.5)',
              }}
            >
              {currentTier?.name || 'Newbie'}
            </motion.div>
            <div className="text-sm text-[hsl(var(--cosmic-gold))] font-medium">
              Achievement Badge
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">
                Next: {nextTier.name}
              </div>
              <div className="text-sm font-bold text-[hsl(var(--cosmic-cyan))]">
                {((nextTier.threshold - totalRewards) / 1_000_000).toFixed(2)}M CAMLY
              </div>
            </div>
          )}
        </div>

        {/* Progress bar with diamond sparkle */}
        {nextTier && (
          <div className="mt-4 relative">
            <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-[hsl(var(--cosmic-gold)/0.3)]">
              <motion.div
                className="h-full relative"
                style={{
                  background: `linear-gradient(90deg, ${currentTier?.glow || '#666'}, ${nextTier.glow})`,
                  width: `${progress}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {/* Diamond sparkle effect */}
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Gem className="w-full h-full text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </motion.div>
              </motion.div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{(totalRewards / 1_000_000).toFixed(2)}M CAMLY</span>
              <span>{(nextTier.threshold / 1_000_000).toFixed(0)}M CAMLY</span>
            </div>
          </div>
        )}

        {/* All tiers display */}
        <div className="flex justify-center gap-4 mt-6">
          {ACHIEVEMENT_TIERS.map((tier, i) => {
            const isUnlocked = totalRewards >= tier.threshold;
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.name}
                className={`p-2 rounded-lg ${isUnlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-gray-800/50'}`}
                whileHover={{ scale: 1.1 }}
                animate={isUnlocked ? {
                  boxShadow: [`0 0 10px ${tier.glow}`, `0 0 20px ${tier.glow}`, `0 0 10px ${tier.glow}`],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Icon className={`w-6 h-6 ${isUnlocked ? 'text-white' : 'text-gray-600'}`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
