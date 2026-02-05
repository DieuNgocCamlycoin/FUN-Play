import { Crown, Users, Video, Eye, MessageCircle, Coins, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

interface HonoboardRightSidebarProps {
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const getRankBadge = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}.`;
};

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
    transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
    whileHover={{ x: 4, scale: 1.02 }}
    className="flex items-center justify-between px-4 py-3 rounded-full
      bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
      shadow-[0_4px_15px_rgba(0,231,255,0.3)] hover:shadow-[0_6px_25px_rgba(122,43,255,0.4)] transition-all duration-200"
  >
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-white" />
      <span className="text-sm font-medium text-white uppercase tracking-wide">
        {label}
      </span>
    </div>
    <span className="text-lg font-bold text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]">
      {loading ? "..." : <CounterAnimation value={value} duration={800} />}
    </span>
  </motion.div>
);

export const HonoboardRightSidebar = ({ className }: HonoboardRightSidebarProps) => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    { icon: Users, label: "TOTAL USERS", value: stats.totalUsers },
    { icon: MessageCircle, label: "TOTAL COMMENTS", value: stats.totalComments },
    { icon: Eye, label: "TOTAL VIEWS", value: stats.totalViews },
    { icon: Video, label: "TOTAL VIDEOS", value: stats.totalVideos },
    { icon: Coins, label: "CAMLY POOL", value: stats.camlyPool },
  ];

  return (
    <aside 
      className={cn(
        "hidden xl:flex flex-col w-72 shrink-0 h-[calc(100vh-3.5rem)]",
        "fixed right-0 top-14 z-40",
        "bg-gradient-to-b from-white via-white to-[#F0FDFF]",
        "border-l-2 border-[#00E7FF]/30",
        "shadow-[-10px_0_30px_rgba(0,231,255,0.1)]",
        className
      )}
    >
      <ScrollArea className="flex-1 px-3 py-4">
        {/* Header with Crown and Title */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 p-4 rounded-xl overflow-hidden
            bg-gradient-to-br from-white via-[#F0F9FF] to-[#FDF4FF]
            border-2 border-[#00E7FF]/40
            shadow-[0_0_25px_rgba(0,231,255,0.2)]"
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="relative flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-6 w-6 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
            </motion.div>
            <h2 className="text-xl font-black italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
              HONOR BOARD
            </h2>
            <motion.div
              animate={{ rotate: [5, -5, 5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-6 w-6 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
            </motion.div>
          </div>
          
          {/* Realtime indicator */}
          <div className="relative flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <motion.span 
              className="relative flex h-2 w-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </motion.span>
            <span>Realtime</span>
          </div>
        </motion.div>

        {/* Platform Stats - Vertical Pill Layout */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 space-y-2"
        >
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
        </motion.div>

        {/* Top 10 Creators */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 rounded-xl
            bg-gradient-to-br from-[#F0FDFF] via-white to-[#FFF8F0]
            border border-[#00E7FF]/25"
        >
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Trophy className="h-4 w-4 text-[#FFD700]" />
            Top 10 Creators
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2 bg-muted rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats.topCreators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No creators yet
            </p>
          ) : (
            <div className="space-y-1">
              {stats.topCreators.map((creator, index) => (
                <motion.div 
                  key={creator.userId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
                    "hover:bg-[#F0FDFF]",
                    index === 0 && "bg-gradient-to-r from-[#FFF8E1] to-transparent border border-[#FFD700]/30",
                    index === 1 && "bg-gradient-to-r from-gray-100/50 to-transparent",
                    index === 2 && "bg-gradient-to-r from-orange-50/50 to-transparent"
                  )}
                >
                  <span className="w-6 text-center font-medium text-sm">
                    {getRankBadge(index + 1)}
                  </span>
                  <Avatar className={cn(
                    "h-8 w-8 border-2",
                    index === 0 && "border-[#FFD700] ring-2 ring-[rgba(255,215,0,0.3)] shadow-[0_0_15px_rgba(255,215,0,0.5),0_0_25px_rgba(0,231,255,0.3)]",
                    index === 1 && "border-gray-400",
                    index === 2 && "border-orange-400",
                    index > 2 && "border-border"
                  )}>
                    <AvatarImage src={creator.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-[#F0FDFF] to-[#FFF8F0]">
                      {creator.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[#7A2BFF]">
                      {creator.displayName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Video className="h-3 w-3" />
                        {creator.videoCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {formatNumber(creator.totalViews)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* FUN Play Branding */}
        <div className="mt-4 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">FUN Play</span>
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
};
