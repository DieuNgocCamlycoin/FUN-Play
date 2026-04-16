import { getLightLevelLabel, getLightLevelEmoji } from "@/lib/fun-money/pplp-engine";
import { getLightLevelV2, LIGHT_LEVELS_V2 } from "@/lib/fun-money/pplp-engine-v2";

interface LightLevelBadgeProps {
  level: string;
  scoreV2?: number;
}

const LEVEL_STYLES: Record<string, string> = {
  presence: "from-emerald-400/20 to-emerald-600/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  contributor: "from-cyan-400/20 to-blue-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  builder: "from-violet-400/20 to-purple-500/20 border-violet-500/40 text-violet-700 dark:text-violet-300",
  guardian: "from-amber-400/20 to-orange-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
  architect: "from-yellow-300/20 to-amber-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300",
  // v2.0 levels
  light_seed: "from-gray-400/20 to-gray-500/20 border-gray-500/40 text-gray-700 dark:text-gray-300",
  light_sprout: "from-green-400/20 to-emerald-500/20 border-green-500/40 text-green-700 dark:text-green-300",
  light_builder: "from-cyan-400/20 to-blue-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  light_guardian: "from-blue-400/20 to-indigo-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300",
  light_leader: "from-amber-400/20 to-orange-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
  cosmic_contributor: "from-purple-400/20 via-pink-500/20 to-amber-400/20 border-purple-500/40 text-purple-700 dark:text-purple-300",
};

export const LightLevelBadge = ({ level, scoreV2 }: LightLevelBadgeProps) => {
  // Use v2 level if scoreV2 is provided
  if (scoreV2 !== undefined && scoreV2 > 0) {
    const v2Level = getLightLevelV2(scoreV2);
    const style = LEVEL_STYLES[v2Level.id] || LEVEL_STYLES.presence;
    return (
      <div
        className={`absolute z-30 left-1/2 -translate-x-1/2 -bottom-8 md:-bottom-10 
          px-3 py-1 rounded-full border backdrop-blur-md bg-gradient-to-r ${style}
          text-[10px] md:text-xs font-bold whitespace-nowrap shadow-lg`}
      >
        <span>{v2Level.emoji}</span>{" "}
        <span>{v2Level.label}</span>
      </div>
    );
  }

  // Fallback to v1
  const label = getLightLevelLabel(level);
  const emoji = getLightLevelEmoji(level);
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.presence;

  return (
    <div
      className={`absolute z-30 left-1/2 -translate-x-1/2 -bottom-8 md:-bottom-10 
        px-3 py-1 rounded-full border backdrop-blur-md bg-gradient-to-r ${style}
        text-[10px] md:text-xs font-bold whitespace-nowrap
        shadow-lg`}
    >
      <span>{emoji}</span>{" "}
      <span>{label}</span>
    </div>
  );
};
