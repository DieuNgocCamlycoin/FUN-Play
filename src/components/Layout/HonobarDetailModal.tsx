import { Crown, Users, Video, Eye, MessageSquare, Coins, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { useIsMobile } from "@/hooks/use-mobile";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { cn } from "@/lib/utils";

interface HonobarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  index: number;
}

const StatPill = ({ icon: Icon, label, value, index }: StatPillProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    className="flex items-center justify-between px-4 py-3 rounded-full
      bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]
      shadow-md"
  >
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-white" />
      <span className="text-sm font-medium text-white uppercase tracking-wide">
        {label}
      </span>
    </div>
    <span className="text-lg font-bold text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]">
      <CounterAnimation value={value} duration={1000} />
    </span>
  </motion.div>
);

const ModalContent = ({ stats, loading }: { stats: ReturnType<typeof useHonobarStats>['stats'], loading: boolean }) => {
  const statItems = [
    { icon: Users, label: "TOTAL USERS", value: stats.totalUsers },
    { icon: MessageSquare, label: "TOTAL COMMENTS", value: stats.totalComments },
    { icon: Eye, label: "TOTAL VIEWS", value: stats.totalViews },
    { icon: Video, label: "TOTAL VIDEOS", value: stats.totalVideos },
    { icon: Coins, label: "CAMLY POOL", value: stats.camlyPool },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Crown */}
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-8 h-8 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
        </motion.div>
        <h2 className="text-2xl font-black italic bg-gradient-to-r from-[#2E7D32] to-[#FFD700] bg-clip-text text-transparent">
          HONOR BOARD
        </h2>
        <motion.div
          animate={{ rotate: [10, -10, 10] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-8 h-8 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
        </motion.div>
      </div>

      {/* Stats - Vertical Pill Layout */}
      <div className="space-y-2">
        {statItems.map((stat, index) => (
          <StatPill
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            index={index}
          />
        ))}
      </div>

      {/* Top 10 Creators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-t border-[#4CAF50]/30 pt-4"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Trophy className="w-4 h-4 text-[#FFD700]" />
          <span className="font-semibold uppercase tracking-wide">Top 10 Creators</span>
        </div>
        
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
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {stats.topCreators.map((creator, index) => (
              <motion.div 
                key={creator.userId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
                  "hover:bg-[#E8F5E9]",
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
                  index === 0 && "border-[#FFD700] ring-2 ring-[rgba(255,215,0,0.3)]",
                  index === 1 && "border-gray-400",
                  index === 2 && "border-orange-400",
                  index > 2 && "border-border"
                )}>
                  <AvatarImage src={creator.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-[#E8F5E9] to-[#FFF8E1]">
                    {creator.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-[#1B5E20]">
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

      {/* Extended Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="border-t border-[#4CAF50]/30 pt-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-[#4CAF50]" />
          <span className="font-medium">Chi tiết thêm:</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[#E8F5E9] to-[#FFF8E1]">
            <span className="text-muted-foreground">Total CAMLY Distributed:</span>
            <span className="font-bold text-[#1B5E20]">{formatNumber(stats.totalRewards)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[#E8F5E9] to-[#FFF8E1]">
            <span className="text-muted-foreground">Total Subscriptions:</span>
            <span className="font-bold text-[#1B5E20]">{formatNumber(stats.totalSubscriptions)}</span>
          </div>
          {stats.topCreator && (
            <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[#E8F5E9] to-[#FFF8E1] sm:col-span-2">
              <span className="text-muted-foreground">Top Creator Video Count:</span>
              <span className="font-bold text-[#1B5E20]">{stats.topCreator.videoCount} videos</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <motion.div
          className="w-2 h-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span>Cập nhật realtime</span>
      </div>
    </div>
  );
};

export const HonobarDetailModal = ({ isOpen, onClose }: HonobarDetailModalProps) => {
  const { stats, loading } = useHonobarStats();
  const isMobile = useIsMobile();

  // Mobile: Use Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl bg-gradient-to-b from-white to-[#E8F5E9] border-t-2 border-[#4CAF50]/50"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Honor Board</SheetTitle>
          </SheetHeader>
          <div className="pt-4 pb-8 overflow-y-auto max-h-full">
            <ModalContent stats={stats} loading={loading} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog (centered modal)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg bg-gradient-to-br from-white via-[#E8F5E9] to-[#FFF8E1] 
          border-2 border-[#4CAF50]/50
          shadow-[0_0_40px_rgba(76,175,80,0.3),0_0_80px_rgba(255,215,0,0.2)]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Honor Board</DialogTitle>
        </DialogHeader>
        <ModalContent stats={stats} loading={loading} />
      </DialogContent>
    </Dialog>
  );
};
