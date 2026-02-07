import { Crown, Users, FileText, Image, Video, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { HonobarStats } from "@/hooks/useHonobarStats";

interface StatPillProps {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  index: number;
}

const StatPill = ({ icon: Icon, label, value, loading, index }: StatPillProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    whileHover={{ x: 4, scale: 1.02 }}
    className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-full overflow-hidden
      bg-gradient-to-r from-[#7A2BFF] via-[#FF00E5] to-[#FFD700]
      shadow-[0_4px_20px_rgba(122,43,255,0.4)] hover:shadow-[0_6px_30px_rgba(255,0,229,0.5)] 
      transition-all duration-300"
  >
    <div className="flex items-center gap-1 min-w-0">
      <Icon className="h-3.5 w-3.5 text-white shrink-0" />
      <span className="text-[10px] font-semibold text-white uppercase tracking-wider truncate">
        {label}
      </span>
    </div>
    <span className="text-base font-black text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)] whitespace-nowrap shrink-0 ml-1">
      {loading ? "..." : <CounterAnimation value={value} duration={800} compact />}
    </span>
  </motion.div>
);

interface HonorBoardCardProps {
  stats: HonobarStats;
  loading: boolean;
  className?: string;
}

export const HonorBoardCard = ({ stats, loading, className }: HonorBoardCardProps) => {
  const statItems = [
    { icon: Users, label: "TOTAL USERS", value: stats.totalUsers },
    { icon: FileText, label: "TOTAL POSTS", value: stats.totalPosts },
    { icon: Image, label: "TOTAL PHOTOS", value: stats.totalPhotos },
    { icon: Video, label: "TOTAL VIDEOS", value: stats.totalVideos },
    { icon: Coins, label: "TOTAL REWARD", value: stats.totalRewards },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className={cn(
        "relative p-4 rounded-2xl overflow-hidden",
        "bg-white/85 backdrop-blur-xl",
        "border-2 border-transparent",
        "shadow-[0_0_30px_rgba(0,231,255,0.3)]",
        "hover:shadow-[0_0_50px_rgba(122,43,255,0.5)]",
        "transition-all duration-500",
        className
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box",
      }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 opacity-0 hover:opacity-100"
        animate={{ x: ["-200%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* Header with Crown and Title */}
      <div className="relative flex items-center justify-center gap-1.5 mb-3">
        <motion.div
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        </motion.div>
        <h2 className="text-lg font-black italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
          HONOR BOARD
        </h2>
        <motion.div
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        </motion.div>
      </div>

      {/* Stats Pills */}
      <div className="relative space-y-2">
        {statItems.map((stat, index) => (
          <StatPill
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            loading={loading}
            index={index}
          />
        ))}
      </div>

      {/* Realtime indicator */}
      <div className="relative flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <motion.span
          className="relative flex h-1.5 w-1.5"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </motion.span>
        <span>Realtime</span>
      </div>
    </motion.div>
  );
};
