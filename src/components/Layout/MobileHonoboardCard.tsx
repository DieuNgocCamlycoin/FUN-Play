import { Crown, Users, FileText, Image, Video, Coins, ChevronRight } from "lucide-react";
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
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-[#7A2BFF] via-[#FF00E5] to-[#FFD700] shadow-[0_2px_8px_rgba(122,43,255,0.3)]">
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
        "bg-white/85 backdrop-blur-lg",
        "border-2 border-transparent",
        "shadow-[0_0_20px_rgba(0,231,255,0.2)]",
        "hover:shadow-[0_0_30px_rgba(122,43,255,0.3)]",
        "transition-all duration-300",
        className
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box",
      }}
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
          <span className="font-black text-sm italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
            HONOR BOARD
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Mini Pills Row - 5 stats */}
      <div className="flex items-center justify-between gap-1.5 py-2 overflow-x-auto scrollbar-hide">
        <MiniPill 
          icon={Users} 
          value={loading ? "..." : formatNumber(stats.totalUsers)} 
        />
        <MiniPill 
          icon={FileText} 
          value={loading ? "..." : formatNumber(stats.totalPosts)} 
        />
        <MiniPill 
          icon={Image} 
          value={loading ? "..." : formatNumber(stats.totalPhotos)} 
        />
        <MiniPill 
          icon={Video} 
          value={loading ? "..." : formatNumber(stats.totalVideos)} 
        />
        <MiniPill 
          icon={Coins} 
          value={loading ? "..." : formatNumber(stats.totalRewards)} 
        />
      </div>

      {/* Realtime indicator */}
      <div className="mt-2 pt-2 border-t border-[#7A2BFF]/20 flex items-center justify-center">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <motion.span
            className="relative flex h-1.5 w-1.5"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </motion.span>
          <span>Live • Tap for details</span>
        </div>
      </div>
    </motion.button>
  );
};
