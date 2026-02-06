import { Crown, Users, Video, Eye, MessageCircle, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { TopRankingSection } from "@/components/Layout/TopRankingSection";

interface HonoboardRightSidebarProps {
  className?: string;
}

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
    className="flex items-center justify-between px-3 py-2.5 rounded-full overflow-hidden
      bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
      shadow-[0_4px_15px_rgba(0,231,255,0.3)] hover:shadow-[0_6px_25px_rgba(122,43,255,0.4)] transition-all duration-200"
  >
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="h-4 w-4 text-white shrink-0" />
      <span className="text-xs font-medium text-white uppercase tracking-wide truncate">
        {label}
      </span>
    </div>
    <span className="text-base font-bold text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)] whitespace-nowrap ml-2">
      {loading ? "..." : <CounterAnimation value={value} duration={800} compact />}
    </span>
  </motion.div>
);

export const HonoboardRightSidebar = ({ className }: HonoboardRightSidebarProps) => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    { icon: Users, label: "USERS", value: stats.totalUsers },
    { icon: MessageCircle, label: "COMMENTS", value: stats.totalComments },
    { icon: Eye, label: "VIEWS", value: stats.totalViews },
    { icon: Video, label: "VIDEOS", value: stats.totalVideos },
    { icon: Coins, label: "CAMLY POOL", value: stats.camlyPool },
  ];

  return (
    <aside 
      className={cn(
        "hidden xl:flex flex-col w-80 shrink-0 h-[calc(100vh-3.5rem)]",
        "fixed right-0 top-14 z-40",
        "bg-gradient-to-b from-white via-white to-[#F0FDFF]",
        "border-l-2 border-[#00E7FF]/30",
        "shadow-[-10px_0_30px_rgba(0,231,255,0.1)]",
        className
      )}
    >
      <ScrollArea className="flex-1 px-4 py-4 overflow-x-hidden">
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

        {/* Top 5 Ranking + Top Sponsors (Combined) */}
        <TopRankingSection showSponsors />

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
