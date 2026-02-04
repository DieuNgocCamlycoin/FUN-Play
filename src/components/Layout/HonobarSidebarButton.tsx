import { Crown, Users, Video, Coins, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useHonobarStats } from "@/hooks/useHonobarStats";

interface HonobarSidebarButtonProps {
  onOpenDetail: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const HonobarSidebarButton = ({ onOpenDetail }: HonobarSidebarButtonProps) => {
  const { stats, loading } = useHonobarStats();

  const miniStats = [
    { icon: Users, value: stats.totalUsers, label: "Users" },
    { icon: Video, value: stats.totalVideos, label: "Videos" },
    { icon: Coins, value: stats.camlyPool, label: "Pool" },
  ];

  return (
    <motion.button
      onClick={onOpenDetail}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full relative overflow-hidden rounded-xl p-3 
        bg-gradient-to-br from-[rgba(0,231,255,0.15)] via-white/95 to-[rgba(255,215,0,0.15)]
        border-2 border-[rgba(0,231,255,0.5)]
        shadow-[0_0_20px_rgba(0,231,255,0.3),0_0_40px_rgba(255,215,0,0.2)]
        hover:shadow-[0_0_30px_rgba(0,231,255,0.5),0_0_60px_rgba(255,215,0,0.3)]
        transition-shadow duration-300
        group cursor-pointer"
      aria-label="Mở Honor Board chi tiết"
    >
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* Header Row */}
      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
          </motion.div>
          <span className="font-bold text-sm bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
            HONOR BOARD
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#00E7FF] group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Mini Stats Grid */}
      <div className="relative grid grid-cols-3 gap-1">
        {miniStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center py-1.5 px-1 rounded-lg
              bg-gradient-to-br from-[rgba(0,231,255,0.1)] to-[rgba(255,215,0,0.1)]
              border border-[rgba(0,231,255,0.2)]"
          >
            <stat.icon className="w-3.5 h-3.5 text-[#00E7FF] mb-0.5" />
            <motion.span
              className="text-xs font-bold text-sky-700"
              animate={{
                textShadow: [
                  "0 0 4px rgba(0,231,255,0.3)",
                  "0 0 8px rgba(255,215,0,0.5)",
                  "0 0 4px rgba(0,231,255,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {loading ? "..." : formatNumber(stat.value)}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.button>
  );
};
