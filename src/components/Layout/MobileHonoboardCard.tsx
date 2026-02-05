import { Crown, Users, Video, Eye, Coins, ChevronRight } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-3 rounded-xl",
        "bg-gradient-to-r from-white via-[rgba(0,231,255,0.05)] to-[rgba(255,215,0,0.1)]",
        "border border-[rgba(0,231,255,0.4)]",
        "shadow-[0_0_20px_rgba(0,231,255,0.15)]",
        "hover:shadow-[0_0_25px_rgba(0,231,255,0.25)]",
        "hover:border-[rgba(255,215,0,0.5)]",
        "transition-all duration-300",
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]" />
          </motion.div>
          <span className="font-bold text-sm bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
            Honor Board
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Stats Row - Horizontal Compact */}
      <div className="flex items-center justify-between gap-2 py-2 px-1 rounded-lg bg-gradient-to-r from-[rgba(0,231,255,0.05)] to-[rgba(255,215,0,0.05)]">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-[#00E7FF]" />
          <span className="font-semibold text-xs text-sky-700">
            {loading ? "..." : formatNumber(stats.totalUsers)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-[#7A2BFF]" />
          <span className="font-semibold text-xs text-sky-700">
            {loading ? "..." : formatNumber(stats.totalVideos)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-[#00E7FF]" />
          <span className="font-semibold text-xs text-sky-700">
            {loading ? "..." : formatNumber(stats.totalViews)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-[#FFD700]" />
          <span className="font-semibold text-xs text-sky-700">
            {loading ? "..." : formatNumber(stats.camlyPool)}
          </span>
        </div>
      </div>

      {/* Top Creator Preview + Live Indicator */}
      <div className="mt-2 pt-2 border-t border-[rgba(0,231,255,0.2)] flex items-center justify-between">
        {stats.topCreator ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">🏆 Top:</span>
            <span className="font-medium text-sky-700 truncate max-w-[120px]">
              {stats.topCreator.displayName}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No creators yet</span>
        )}
        
        {/* Realtime indicator */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <motion.span 
            className="relative flex h-1.5 w-1.5"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </motion.span>
          <span>Live</span>
        </div>
      </div>
    </motion.button>
  );
};
