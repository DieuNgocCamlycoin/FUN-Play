import { Crown, Users, Video, Eye, MessageSquare, Coins, Trophy, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { useIsMobile } from "@/hooks/use-mobile";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

interface HonobarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  index: number;
  isString?: boolean;
}

const StatCard = ({ icon: Icon, label, value, index, isString }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
    className="relative overflow-hidden rounded-xl p-4
      bg-gradient-to-br from-[rgba(0,231,255,0.1)] via-white/95 to-[rgba(255,215,0,0.1)]
      border border-[rgba(0,231,255,0.3)]
      hover:border-[rgba(255,215,0,0.6)]
      hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]
      transition-all duration-300"
  >
    {/* Shimmer */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
    />

    <div className="relative flex flex-col items-center gap-2">
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
      >
        <Icon className="w-6 h-6 text-[#00E7FF] drop-shadow-[0_0_8px_rgba(0,231,255,0.6)]" />
      </motion.div>
      
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
      
      <motion.div
        animate={{
          textShadow: [
            "0 0 4px rgba(0,231,255,0.3)",
            "0 0 8px rgba(255,215,0,0.5)",
            "0 0 4px rgba(0,231,255,0.3)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-lg font-bold text-sky-700"
      >
        {isString ? (
          <span className="text-sm">{value}</span>
        ) : (
          <CounterAnimation value={Number(value)} duration={1000} />
        )}
      </motion.div>
    </div>
  </motion.div>
);

const ModalContent = ({ stats, loading }: { stats: ReturnType<typeof useHonobarStats>['stats'], loading: boolean }) => {
  const statItems = [
    { icon: Users, label: "Người dùng", value: stats.totalUsers },
    { icon: Video, label: "Video", value: stats.totalVideos },
    { icon: Eye, label: "Lượt xem", value: stats.totalViews },
    { icon: MessageSquare, label: "Bình luận", value: stats.totalComments },
    { icon: Coins, label: "CAMLY Pool", value: stats.camlyPool },
    { icon: Trophy, label: "Top Creator", value: stats.topCreator?.displayName || "N/A", isString: true },
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
        <h2 className="text-2xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
          HONOR BOARD
        </h2>
        <motion.div
          animate={{ rotate: [10, -10, 10] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-8 h-8 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {statItems.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            index={index}
            isString={stat.isString}
          />
        ))}
      </div>

      {/* Extended Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-t border-[rgba(0,231,255,0.3)] pt-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-[#00E7FF]" />
          <span className="font-medium">Chi tiết thêm:</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[rgba(0,231,255,0.05)] to-[rgba(255,215,0,0.05)]">
            <span className="text-muted-foreground">Total CAMLY Distributed:</span>
            <span className="font-bold text-sky-700">{formatNumber(stats.totalRewards)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[rgba(0,231,255,0.05)] to-[rgba(255,215,0,0.05)]">
            <span className="text-muted-foreground">Total Subscriptions:</span>
            <span className="font-bold text-sky-700">{formatNumber(stats.totalSubscriptions)}</span>
          </div>
          {stats.topCreator && (
            <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[rgba(0,231,255,0.05)] to-[rgba(255,215,0,0.05)] sm:col-span-2">
              <span className="text-muted-foreground">Top Creator Video Count:</span>
              <span className="font-bold text-sky-700">{stats.topCreator.videoCount} videos</span>
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
          className="h-[85vh] rounded-t-3xl bg-gradient-to-b from-white to-[rgba(0,231,255,0.05)] border-t-2 border-[rgba(0,231,255,0.5)]"
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
        className="max-w-lg bg-gradient-to-br from-white via-[rgba(0,231,255,0.02)] to-[rgba(255,215,0,0.05)] 
          border-2 border-[rgba(0,231,255,0.5)]
          shadow-[0_0_40px_rgba(0,231,255,0.3),0_0_80px_rgba(255,215,0,0.2)]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Honor Board</DialogTitle>
        </DialogHeader>
        <ModalContent stats={stats} loading={loading} />
      </DialogContent>
    </Dialog>
  );
};
