import { getLightLevelLabel, getLightLevelEmoji } from "@/lib/fun-money/pplp-engine";

interface LightLevelBadgeProps {
  level: string;
}

const LEVEL_STYLES: Record<string, string> = {
  presence: "from-emerald-400/20 to-emerald-600/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  contributor: "from-cyan-400/20 to-blue-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  builder: "from-violet-400/20 to-purple-500/20 border-violet-500/40 text-violet-700 dark:text-violet-300",
  guardian: "from-amber-400/20 to-orange-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
  architect: "from-yellow-300/20 to-amber-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300",
};

export const LightLevelBadge = ({ level }: LightLevelBadgeProps) => {
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
