import { motion } from "framer-motion";
import { Award, Crown, Gem, Medal } from "lucide-react";

interface AchievementBadgesProps {
  totalRewards: number;
}

const ACHIEVEMENT_TIERS = [
  { name: "Bronze", threshold: 1_000_000, icon: Medal, color: "from-amber-600 to-orange-400", glow: "#cd7f32" },
  { name: "Silver", threshold: 3_000_000, icon: Award, color: "from-gray-300 to-slate-400", glow: "#c0c0c0" },
  { name: "Gold", threshold: 5_000_000, icon: Crown, color: "from-yellow-400 to-amber-500", glow: "#ffd700" },
  { name: "Diamond", threshold: 10_000_000, icon: Gem, color: "from-cyan-300 to-blue-400", glow: "#00e7ff" },
];

export const AchievementBadges = ({ totalRewards }: AchievementBadgesProps) => {
  const unlockedBadges = ACHIEVEMENT_TIERS.filter(
    (level) => totalRewards >= level.threshold
  );

  const currentLevel = unlockedBadges[unlockedBadges.length - 1];
  const nextLevel = ACHIEVEMENT_TIERS.find(
    (level) => totalRewards < level.threshold
  );

  if (unlockedBadges.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Achievement Badges
        </h3>
      </div>

      {currentLevel && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-4"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-xl border-2 border-cyan-400/50 p-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  filter: [
                    `drop-shadow(0 0 10px ${currentLevel.glow})`,
                    `drop-shadow(0 0 20px ${currentLevel.glow})`,
                    `drop-shadow(0 0 10px ${currentLevel.glow})`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className={`p-4 rounded-full bg-gradient-to-br ${currentLevel.color}`}
              >
                <currentLevel.icon className="w-8 h-8 text-white" />
              </motion.div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Current Level</div>
                <div className={`text-2xl font-bold bg-gradient-to-br ${currentLevel.color} bg-clip-text text-transparent`}>
                  {currentLevel.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalRewards.toLocaleString()} CAMLY
                </div>
              </div>
            </div>

            {nextLevel && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress to {nextLevel.name}</span>
                  <span>{(totalRewards / 1_000_000).toFixed(1)}M / {(nextLevel.threshold / 1_000_000).toFixed(0)}M</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalRewards / nextLevel.threshold) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${nextLevel.color} rounded-full`}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACHIEVEMENT_TIERS.map((level, index) => {
          const isUnlocked = totalRewards >= level.threshold;
          const Icon = level.icon;

          return (
            <motion.div
              key={level.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div
                className={`relative overflow-hidden rounded-lg backdrop-blur-sm border-2 p-4 transition-all duration-300 ${
                  isUnlocked
                    ? `bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-cyan-400/50`
                    : "bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {isUnlocked ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        filter: [`drop-shadow(0 0 5px ${level.glow})`, `drop-shadow(0 0 10px ${level.glow})`, `drop-shadow(0 0 5px ${level.glow})`],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    >
                      <Icon className={`w-8 h-8 bg-gradient-to-br ${level.color} bg-clip-text text-transparent`} />
                    </motion.div>
                  ) : (
                    <Icon className="w-8 h-8 text-gray-500/50" />
                  )}
                  <div className={`text-xs font-bold text-center ${isUnlocked ? `bg-gradient-to-br ${level.color} bg-clip-text text-transparent` : "text-gray-500/50"}`}>
                    {level.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 text-center">
                    {(level.threshold / 1_000_000).toFixed(0)}M CAMLY
                  </div>
                </div>

                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                    <div className="text-3xl">🔒</div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
