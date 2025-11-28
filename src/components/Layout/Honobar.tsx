import { Users, Video, Eye, MessageSquare, Coins, UserPlus } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { CounterAnimation } from "./CounterAnimation";
import { motion } from "framer-motion";

export const Honobar = () => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    {
      icon: Users,
      label: "Tổng người dùng",
      labelEn: "Total Users",
      value: stats.totalUsers,
      color: "from-blue-400 to-cyan-400",
    },
    {
      icon: Video,
      label: "Tổng video",
      labelEn: "Total Videos",
      value: stats.totalVideos,
      color: "from-purple-400 to-pink-400",
    },
    {
      icon: Eye,
      label: "Lượt xem",
      labelEn: "Total Views",
      value: stats.totalViews,
      color: "from-green-400 to-emerald-400",
    },
    {
      icon: MessageSquare,
      label: "Bình luận",
      labelEn: "Total Comments",
      value: stats.totalComments,
      color: "from-orange-400 to-red-400",
    },
    {
      icon: Coins,
      label: "Phần thưởng đã phát",
      labelEn: "Total Rewards",
      value: stats.totalRewards,
      color: "from-yellow-400 to-amber-400",
      decimals: 3,
      isCrypto: true,
    },
    {
      icon: UserPlus,
      label: "Đăng ký kênh",
      labelEn: "Channel Subs",
      value: stats.totalSubscriptions,
      color: "from-indigo-400 to-violet-400",
    },
  ];

  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg"
    >
      <div className="container mx-auto px-2 md:px-4 py-2 md:py-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.labelEn}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-lg bg-card/50 backdrop-blur-sm border border-border/30 p-2 md:p-3 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative space-y-1">
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br ${item.color} bg-clip-text text-transparent`} />
                      {item.isCrypto && (
                        <span className="text-[10px] md:text-xs text-muted-foreground">tokens</span>
                      )}
                    </div>
                    
                    <div className={`text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-br ${item.color} bg-clip-text text-transparent`}>
                      <CounterAnimation 
                        value={item.value} 
                        decimals={item.decimals || 0}
                      />
                    </div>
                    
                    <div className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight">
                      {item.label}
                    </div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </motion.div>
  );
};
