import { Users, Video, Eye, MessageSquare, Coins, Trophy, Crown } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { CounterAnimation } from "./CounterAnimation";
import { motion } from "framer-motion";

export const EnhancedHonobar = () => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    { icon: Users, label: "Người dùng", value: stats.totalUsers, type: "number" },
    { icon: Video, label: "Video", value: stats.totalVideos, type: "number" },
    { icon: Eye, label: "Lượt xem", value: stats.totalViews, type: "number" },
    { icon: MessageSquare, label: "Bình luận", value: stats.totalComments, type: "number" },
    { icon: Coins, label: "CAMLY Pool", value: stats.camlyPool, decimals: 0, type: "camly" },
    { icon: Trophy, label: "Top Creator", value: stats.topCreator?.displayName || "---", type: "text" },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="fixed top-20 right-4 z-20"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00E7FF]/30 to-[#FFD700]/30 blur-xl" />
          <div className="relative p-4 rounded-2xl bg-white/95 backdrop-blur-xl border-2 border-[#00E7FF]/50 shadow-[0_0_40px_rgba(0,231,255,0.3)]">
            <div className="flex items-center justify-center gap-2 mb-3 pb-2 border-b border-[#00E7FF]/30">
              <Crown className="w-4 h-4 text-[#FFD700]" />
              <span className="text-sm font-extrabold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
                HONOR BOARD
              </span>
              <Crown className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gradient-to-r from-[#00E7FF]/20 to-[#FFD700]/20 rounded-xl h-12 w-44" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      className="fixed top-20 right-4 z-20"
    >
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00E7FF]/30 to-[#FFD700]/30 blur-xl" />
        
        {/* Main Card */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#00E7FF]/5 via-white/95 to-[#FFD700]/5 backdrop-blur-xl border-2 border-[#00E7FF]/50 shadow-[0_0_40px_rgba(0,231,255,0.3),0_0_60px_rgba(255,215,0,0.2)]">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-3 pb-2 border-b border-[#00E7FF]/30">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-4 h-4 text-[#FFD700]" />
            </motion.div>
            <span className="text-sm font-extrabold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent tracking-wide">
              HONOR BOARD
            </span>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-4 h-4 text-[#FFD700]" />
            </motion.div>
          </div>
          
          {/* Stats List */}
          <div className="space-y-2">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02, x: -4 }}
                  className="relative group"
                >
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-[#00E7FF]/10 to-[#FFD700]/10 border border-[#00E7FF]/30 hover:border-[#FFD700]/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300 overflow-hidden">
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                      animate={{ x: ["-200%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                    />
                    
                    {/* Icon with Pulse */}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
                      className="relative z-10 p-1.5 rounded-lg bg-gradient-to-br from-[#00E7FF]/20 to-[#7A2BFF]/20"
                    >
                      <Icon className="w-4 h-4 text-[#00E7FF]" />
                    </motion.div>
                    
                    {/* Label & Value */}
                    <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {item.label}
                      </span>
                      <motion.span
                        animate={{
                          textShadow: [
                            "0 0 4px rgba(0,231,255,0.3)",
                            "0 0 8px rgba(255,215,0,0.5)",
                            "0 0 4px rgba(0,231,255,0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-sm font-bold bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent tabular-nums"
                      >
                        {item.type === "number" && (
                          <CounterAnimation value={item.value as number} decimals={item.decimals || 0} />
                        )}
                        {item.type === "camly" && (
                          <>
                            <CounterAnimation value={item.value as number} decimals={0} />
                            <span className="text-[10px] ml-1 text-[#FFD700]">CAMLY</span>
                          </>
                        )}
                        {item.type === "text" && item.value}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
