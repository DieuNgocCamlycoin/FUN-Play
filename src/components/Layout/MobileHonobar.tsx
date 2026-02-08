import { useState } from "react";
import { Users, Video, Eye, MessageSquare, Coins, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { CounterAnimation } from "./CounterAnimation";
import { motion, AnimatePresence } from "framer-motion";

export const MobileHonobar = () => {
  const { stats, loading } = useHonobarStats();
  const [isExpanded, setIsExpanded] = useState(true);

  const statItems = [
    { icon: Users, label: "Người dùng", value: stats.totalUsers, type: "number" },
    { icon: Video, label: "Video", value: stats.totalVideos, type: "number" },
    { icon: Eye, label: "Lượt xem", value: stats.totalViews, type: "number" },
    { icon: MessageSquare, label: "Bình luận", value: stats.totalComments, type: "number" },
    { icon: Coins, label: "Quỹ", value: stats.camlyPool, type: "camly" },
  ];

  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (loading) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-3 right-3 z-20"
      >
        <div className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#00E7FF]/40 shadow-lg">
          <div className="flex items-center gap-1 mb-1.5">
            <Crown className="w-3 h-3 text-[#FFD700]" />
            <span className="text-[9px] font-bold bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent">
              HONOR
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gradient-to-br from-[#00E7FF]/20 to-[#FFD700]/20 rounded-lg h-10 w-14" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="absolute top-3 right-3 z-20"
    >
      <div className="relative">
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00E7FF]/20 to-[#FFD700]/20 blur-md" />
        
        <div className="relative p-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#00E7FF]/40 shadow-[0_4px_20px_rgba(0,231,255,0.2)]">
          {/* Header with toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-[#00E7FF]/20"
          >
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-[#FFD700]" />
              <span className="text-[9px] font-bold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent tracking-wide">
                HONOR BOARD
              </span>
              <Crown className="w-3 h-3 text-[#FFD700]" />
            </div>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-[#00E7FF]" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#00E7FF]" />
            )}
          </button>
          
          {/* Stats Grid */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-1">
                  {statItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-gradient-to-br from-[#00E7FF]/5 to-[#FFD700]/5 border border-[#00E7FF]/20"
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-[#00E7FF]/15 to-[#7A2BFF]/15">
                          <Icon className="w-3 h-3 text-[#00E7FF]" />
                        </div>
                        <span className="text-[7px] text-muted-foreground font-medium leading-none">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-bold bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent tabular-nums leading-none">
                          {item.type === "number" && formatCompact(item.value as number)}
                          {item.type === "camly" && (
                            <>
                              {formatCompact(item.value as number)}
                              <span className="text-[6px] ml-0.5 text-[#FFD700]">C</span>
                            </>
                          )}
                          {item.type === "text" && item.value}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
