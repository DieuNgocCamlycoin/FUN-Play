import { motion } from "framer-motion";
import { Medal, Award, Crown, Gem, Sparkles, Star } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

interface LuxuryHonobarProps {
  totalRewards: number;
  previousTotal?: number;
}

const ACHIEVEMENT_TIERS = [
  { name: "Bronze", threshold: 1_000_000, icon: Medal, color: "from-amber-700 via-orange-500 to-amber-600", glow: "#cd7f32", shadowColor: "rgba(205,127,50,0.6)" },
  { name: "Silver", threshold: 3_000_000, icon: Award, color: "from-slate-300 via-gray-100 to-slate-400", glow: "#c0c0c0", shadowColor: "rgba(192,192,192,0.6)" },
  { name: "Gold", threshold: 5_000_000, icon: Crown, color: "from-yellow-300 via-amber-400 to-yellow-500", glow: "#ffd700", shadowColor: "rgba(255,215,0,0.6)" },
  { name: "Diamond", threshold: 10_000_000, icon: Gem, color: "from-cyan-200 via-blue-300 to-purple-300", glow: "#00e7ff", shadowColor: "rgba(0,231,255,0.6)" },
];

export const LuxuryHonobar = ({ totalRewards, previousTotal = 0 }: LuxuryHonobarProps) => {
  const hasTriggeredRankUp = useRef(false);

  const currentTier = [...ACHIEVEMENT_TIERS].reverse().find(t => totalRewards >= t.threshold);
  const nextTier = ACHIEVEMENT_TIERS.find(t => totalRewards < t.threshold);
  
  const prevTier = [...ACHIEVEMENT_TIERS].reverse().find(t => previousTotal >= t.threshold);

  useEffect(() => {
    if (currentTier && prevTier && currentTier.threshold > prevTier.threshold && !hasTriggeredRankUp.current) {
      hasTriggeredRankUp.current = true;
      triggerRankUpCelebration();
    }
  }, [currentTier, prevTier]);

  const triggerRankUpCelebration = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});

    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const colors = ['#ffd700', '#ff00e5', '#00e7ff', '#7a2bff', '#cd7f32', '#c0c0c0'];

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
      {/* 3D Metallic Gold Border with layered depth */}
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `
            linear-gradient(145deg, 
              #ffd700 0%, 
              #b8860b 15%, 
              #ffeaa7 30%, 
              #daa520 45%, 
              #ffd700 50%, 
              #b8860b 65%, 
              #ffeaa7 80%, 
              #daa520 90%, 
              #ffd700 100%
            )
          `,
          padding: '4px',
          boxShadow: `
            0 0 20px rgba(255,215,0,0.5),
            inset 0 2px 4px rgba(255,255,255,0.8),
            inset 0 -2px 4px rgba(0,0,0,0.3)
          `,
        }}
      >
        <div 
          className="w-full h-full rounded-xl bg-gradient-to-br from-[#1a0a2e] via-[#0d0015] to-[#1a0a2e]"
          style={{
            boxShadow: `
              inset 0 2px 15px rgba(255,215,0,0.2),
              inset 0 -2px 15px rgba(138,43,226,0.3)
            `,
          }}
        />
      </div>

      {/* Floating Stars Background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
              y: [0, -30, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          >
            <Star className="w-2 h-2 text-yellow-300 fill-yellow-300 drop-shadow-[0_0_4px_rgba(255,215,0,0.8)]" />
          </motion.div>
        ))}
        
        {/* Golden Sparkles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 1.5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]" />
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-6">
          {/* Current tier icon with 3D metallic effect */}
          <motion.div
            className="relative"
            animate={{
              rotateY: [0, 10, 0, -10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div 
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${currentTier?.color || 'from-gray-400 to-gray-600'}`}
              style={{
                boxShadow: `
                  0 0 30px ${currentTier?.shadowColor || 'rgba(100,100,100,0.5)'},
                  0 10px 40px ${currentTier?.shadowColor || 'rgba(100,100,100,0.3)'},
                  inset 0 2px 10px rgba(255,255,255,0.5),
                  inset 0 -2px 10px rgba(0,0,0,0.3)
                `,
              }}
            >
              {/* 3D Inner glow */}
              <div className="absolute inset-1 rounded-xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              <TierIcon className="w-12 h-12 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
            
            {/* Orbiting sparkle */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
            >
              <Gem className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,231,255,0.8)]" />
            </motion.div>
          </motion.div>

          {/* Tier info with 3D text */}
          <div className="flex-1">
            <motion.div
              className="text-4xl font-black tracking-wide"
              style={{
                background: `linear-gradient(135deg, 
                  #ffd700 0%, 
                  #fff8dc 25%, 
                  #ffd700 50%, 
                  #daa520 75%, 
                  #ffd700 100%
                )`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.5))',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {currentTier?.name || 'Newbie'}
            </motion.div>
            <div 
              className="text-sm font-semibold mt-1"
              style={{
                background: 'linear-gradient(90deg, #ffd700, #ffa500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ✦ Achievement Badge ✦
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="text-right">
              <div className="text-xs text-amber-200/70 mb-1 font-medium">
                Next: {nextTier.name}
              </div>
              <motion.div 
                className="text-lg font-bold"
                style={{
                  background: 'linear-gradient(90deg, #00e7ff, #7a2bff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={{
                  textShadow: [
                    '0 0 10px rgba(0,231,255,0.5)',
                    '0 0 20px rgba(0,231,255,0.8)',
                    '0 0 10px rgba(0,231,255,0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {((nextTier.threshold - totalRewards) / 1_000_000).toFixed(2)}M
              </motion.div>
            </div>
          )}
        </div>

        {/* Progress bar with diamond sparkle fill */}
        {nextTier && (
          <div className="mt-6 relative">
            {/* Progress bar container with 3D effect */}
            <div 
              className="h-4 rounded-full overflow-hidden relative"
              style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0015 100%)',
                boxShadow: `
                  inset 0 2px 8px rgba(0,0,0,0.8),
                  0 1px 0 rgba(255,215,0,0.2)
                `,
                border: '2px solid rgba(255,215,0,0.3)',
              }}
            >
              {/* Animated fill with diamond sparkles */}
              <motion.div
                className="h-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, 
                    ${currentTier?.glow || '#666'} 0%,
                    ${nextTier.glow} 50%,
                    #fff 70%,
                    ${nextTier.glow} 100%
                  )`,
                  backgroundSize: '200% 100%',
                }}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${progress}%`,
                  backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                }}
                transition={{ 
                  width: { duration: 1.5, ease: "easeOut" },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
              >
                {/* Inner shine */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20" />
                
                {/* Moving sparkles inside progress bar */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg]" />
                </motion.div>
              </motion.div>

              {/* Diamond sparkle at progress end */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{ left: `${Math.min(progress, 98)}%` }}
                animate={{
                  scale: [1, 1.4, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ 
                  scale: { duration: 1, repeat: Infinity },
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
              >
                <div className="relative">
                  <Gem className="w-7 h-7 text-cyan-200 drop-shadow-[0_0_15px_rgba(0,231,255,1)]" />
                  {/* Diamond rays */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-10 h-0.5 bg-gradient-to-r from-cyan-300 to-transparent"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                        transformOrigin: 'left center',
                      }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scaleX: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Progress labels */}
            <div className="flex justify-between text-xs mt-2">
              <span className="text-amber-300/80 font-medium">
                {(totalRewards / 1_000_000).toFixed(2)}M CAMLY
              </span>
              <span className="text-cyan-300/80 font-medium">
                {(nextTier.threshold / 1_000_000).toFixed(0)}M CAMLY
              </span>
            </div>
          </div>
        )}

        {/* All tiers display with 3D metallic icons */}
        <div className="flex justify-center gap-5 mt-6">
          {ACHIEVEMENT_TIERS.map((tier) => {
            const isUnlocked = totalRewards >= tier.threshold;
            const isCurrent = currentTier?.name === tier.name;
            const Icon = tier.icon;
            
            return (
              <motion.div
                key={tier.name}
                className="relative"
                whileHover={{ scale: 1.15, y: -5 }}
                animate={isCurrent ? {
                  y: [0, -5, 0],
                } : {}}
                transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              >
                <div 
                  className={`p-3 rounded-xl ${isUnlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-gray-800/50'}`}
                  style={{
                    boxShadow: isUnlocked 
                      ? `
                          0 0 20px ${tier.shadowColor},
                          inset 0 2px 5px rgba(255,255,255,0.4),
                          inset 0 -2px 5px rgba(0,0,0,0.3)
                        `
                      : 'inset 0 2px 5px rgba(0,0,0,0.5)',
                  }}
                >
                  {isUnlocked && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  )}
                  <Icon className={`w-7 h-7 ${isUnlocked ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]' : 'text-gray-600'}`} />
                </div>
                
                {/* Tier name label */}
                <div className={`text-[10px] text-center mt-1 font-semibold ${isUnlocked ? 'text-amber-300' : 'text-gray-600'}`}>
                  {tier.name}
                </div>
                
                {/* Active tier indicator */}
                {isCurrent && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
