import { motion } from "framer-motion";
import { Award, Crown, Gem, Medal } from "lucide-react";

interface AchievementBadgesProps {
  totalRewards: number;
}

const ACHIEVEMENT_LEVELS = [
  {
    name: "Bronze",
    threshold: 10,
    icon: Medal,
    color: "from-orange-400 to-amber-600",
    glow: "rgba(251, 146, 60, 0.6)",
    label: "Đồng",
  },
  {
    name: "Silver",
    threshold: 100,
    icon: Award,
    color: "from-gray-300 to-gray-500",
    glow: "rgba(209, 213, 219, 0.6)",
    label: "Bạc",
  },
  {
    name: "Gold",
    threshold: 1000,
    icon: Crown,
    color: "from-yellow-300 to-yellow-500",
    glow: "rgba(250, 204, 21, 0.6)",
    label: "Vàng",
  },
  {
    name: "Diamond",
    threshold: 10000,
    icon: Gem,
    color: "from-cyan-300 to-blue-500",
    glow: "rgba(0, 231, 255, 0.6)",
    label: "Kim Cương",
  },
];

export const AchievementBadges = ({ totalRewards }: AchievementBadgesProps) => {
  const unlockedBadges = ACHIEVEMENT_LEVELS.filter(
    (level) => totalRewards >= level.threshold
  );

  const currentLevel = unlockedBadges[unlockedBadges.length - 1];
  const nextLevel = ACHIEVEMENT_LEVELS.find(
    (level) => totalRewards < level.threshold
  );

  if (unlockedBadges.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Huy Hiệu Thành Tích
        </h3>
      </div>

      {/* Current Level Display */}
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
                  rotate: [0, 5, -5, 0],
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
                <div className="text-sm text-muted-foreground mb-1">
                  Cấp độ hiện tại
                </div>
                <div className={`text-2xl font-bold bg-gradient-to-br ${currentLevel.color} bg-clip-text text-transparent`}>
                  {currentLevel.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {totalRewards.toFixed(3)} CAMLY
                </div>
              </div>
            </div>

            {/* Progress to Next Level */}
            {nextLevel && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Tiến độ đến {nextLevel.label}</span>
                  <span>
                    {totalRewards.toFixed(0)} / {nextLevel.threshold}
                  </span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(totalRewards / nextLevel.threshold) * 100}%`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${nextLevel.color} rounded-full`}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* All Badges Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACHIEVEMENT_LEVELS.map((level, index) => {
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
                    ? `bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-cyan-400/50 hover:border-cyan-400/70 hover:shadow-[0_0_20px_${level.glow}]`
                    : "bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {isUnlocked ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        filter: [
                          `drop-shadow(0 0 5px ${level.glow})`,
                          `drop-shadow(0 0 10px ${level.glow})`,
                          `drop-shadow(0 0 5px ${level.glow})`,
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    >
                      <Icon
                        className={`w-8 h-8 bg-gradient-to-br ${level.color} bg-clip-text text-transparent`}
                      />
                    </motion.div>
                  ) : (
                    <Icon className="w-8 h-8 text-gray-500/50" />
                  )}
                  <div
                    className={`text-xs font-bold text-center ${
                      isUnlocked
                        ? `bg-gradient-to-br ${level.color} bg-clip-text text-transparent`
                        : "text-gray-500/50"
                    }`}
                  >
                    {level.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 text-center">
                    {level.threshold.toLocaleString()} CAMLY
                  </div>
                </div>

                {/* Locked Overlay */}
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
