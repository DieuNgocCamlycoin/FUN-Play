import { Crown, Users, Video, Coins, ChevronRight } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { cn } from "@/lib/utils";

interface MobileHonoboardCardProps {
  onClick: () => void;
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const MobileHonoboardCard = ({ onClick, className }: MobileHonoboardCardProps) => {
  const { stats, loading } = useHonobarStats();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-xl",
        "bg-gradient-to-r from-yellow-50 via-white to-cyan-50",
        "border border-yellow-300/50",
        "shadow-[0_0_15px_rgba(250,204,21,0.15)]",
        "hover:shadow-[0_0_20px_rgba(250,204,21,0.25)]",
        "active:scale-[0.98]",
        "transition-all duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold text-sm bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">
            Honor Board
          </span>
        </div>

        {/* Right: Stats preview + Arrow */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-sky-500" />
              <span className="font-medium">{loading ? "..." : formatNumber(stats.totalUsers)}</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Video className="h-3.5 w-3.5 text-purple-500" />
              <span className="font-medium">{loading ? "..." : formatNumber(stats.totalVideos)}</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-yellow-500" />
              <span className="font-medium">{loading ? "..." : formatNumber(stats.camlyPool)}</span>
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Top Creator Preview */}
      {stats.topCreator && (
        <div className="mt-2 pt-2 border-t border-yellow-200/50 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">🏆 Top Creator:</span>
          <span className="font-medium text-sky-700">{stats.topCreator.displayName}</span>
        </div>
      )}

      {/* Realtime indicator */}
      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
        <span>Live</span>
      </div>
    </button>
  );
};
