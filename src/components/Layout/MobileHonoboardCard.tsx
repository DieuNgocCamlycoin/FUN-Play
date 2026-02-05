import { Crown, Users, Video, Coins, ChevronRight, Eye } from "lucide-react";
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

interface MiniPillProps {
  icon: React.ElementType;
  value: string;
}

const MiniPill = ({ icon: Icon, value }: MiniPillProps) => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]">
    <Icon className="h-3 w-3 text-white" />
    <span className="text-xs font-bold text-[#FFD700]">{value}</span>
  </div>
);

export const MobileHonoboardCard = ({ onClick, className }: MobileHonoboardCardProps) => {
  const { stats, loading } = useHonobarStats();

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-3 rounded-xl",
        "bg-gradient-to-r from-white via-[#E8F5E9] to-[#FFF8E1]",
        "border border-[#4CAF50]/40",
        "shadow-[0_0_20px_rgba(76,175,80,0.15)]",
        "hover:shadow-[0_0_25px_rgba(76,175,80,0.25)]",
        "hover:border-[#FFD700]/50",
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
          <span className="font-black text-sm italic bg-gradient-to-r from-[#2E7D32] to-[#FFD700] bg-clip-text text-transparent">
            HONOR BOARD
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Mini Pills Row */}
      <div className="flex items-center justify-between gap-2 py-2">
        <MiniPill 
          icon={Users} 
          value={loading ? "..." : formatNumber(stats.totalUsers)} 
        />
        <MiniPill 
          icon={Video} 
          value={loading ? "..." : formatNumber(stats.totalVideos)} 
        />
        <MiniPill 
          icon={Eye} 
          value={loading ? "..." : formatNumber(stats.totalViews)} 
        />
        <MiniPill 
          icon={Coins} 
          value={loading ? "..." : formatNumber(stats.camlyPool)} 
        />
      </div>

      {/* Top Creator Preview + Live Indicator */}
      <div className="mt-2 pt-2 border-t border-[#4CAF50]/20 flex items-center justify-between">
        {stats.topCreator ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">🏆 Top:</span>
            <span className="font-medium text-[#1B5E20] truncate max-w-[120px]">
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
