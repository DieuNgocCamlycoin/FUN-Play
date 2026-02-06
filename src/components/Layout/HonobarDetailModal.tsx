import { Crown, Users, Video, Eye, MessageSquare, Coins, Gem, TrendingUp, Heart, Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { useTopRanking } from "@/hooks/useTopRanking";
import { useTopSponsors } from "@/hooks/useTopSponsors";
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
      bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
      shadow-[0_4px_15px_rgba(0,231,255,0.3)]"
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

interface ModalContentProps {
  stats: ReturnType<typeof useHonobarStats>['stats'];
  loading: boolean;
  ranking: ReturnType<typeof useTopRanking>['users'];
  rankingLoading: boolean;
  sponsors: ReturnType<typeof useTopSponsors>['sponsors'];
  sponsorsLoading: boolean;
  onDonate: () => void;
}

const ModalContent = ({ stats, loading, ranking, rankingLoading, sponsors, sponsorsLoading, onDonate }: ModalContentProps) => {
  const statItems = [
    { icon: Users, label: "USERS", value: stats.totalUsers },
    { icon: MessageSquare, label: "COMMENTS", value: stats.totalComments },
    { icon: Eye, label: "VIEWS", value: stats.totalViews },
    { icon: Video, label: "VIDEOS", value: stats.totalVideos },
    { icon: Coins, label: "CAMLY POOL", value: stats.camlyPool },
  ];

  return (
    <div className="space-y-5">
      {/* Header with Crown */}
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-8 h-8 text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
        </motion.div>
        <h2 className="text-2xl font-black italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
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

      {/* Top 5 Ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border-t border-[#00E7FF]/30 pt-4"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Medal className="w-4 h-4 text-[#FFD700]" />
          <span className="font-semibold uppercase tracking-wide">Top 5 Ranking</span>
        </div>
        
        {rankingLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-muted" />
                <div className="flex-1 h-3 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No rankings yet</p>
        ) : (
          <div className="space-y-1">
            {ranking.slice(0, 5).map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  index === 0 && "bg-gradient-to-r from-[#FFF8E1] to-transparent border border-[#FFD700]/30",
                  index === 1 && "bg-gradient-to-r from-gray-100/50 to-transparent",
                  index === 2 && "bg-gradient-to-r from-orange-50/50 to-transparent"
                )}
              >
                <span className="w-5 text-center text-sm">{getRankBadge(index + 1)}</span>
                <Avatar className="h-7 w-7 border">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold text-[#7A2BFF] truncate">
                  {user.display_name || user.username}
                </span>
                <span className="text-sm font-bold text-[#FFD700]">
                  {formatNumber(user.total_camly_rewards)} CAMLY
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Top Sponsors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border-t border-[#00E7FF]/30 pt-4"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Gem className="w-4 h-4 text-[#FF00E5]" />
          <span className="font-semibold uppercase tracking-wide">Top Sponsors</span>
        </div>
        
        {sponsorsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-muted" />
                <div className="flex-1 h-3 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No sponsors yet</p>
        ) : (
          <div className="space-y-1">
            {sponsors.slice(0, 5).map((sponsor, index) => (
              <div
                key={sponsor.userId}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  index === 0 && "bg-gradient-to-r from-[#FFF8E1] to-transparent border border-[#FFD700]/30",
                  index === 1 && "bg-gradient-to-r from-gray-100/50 to-transparent",
                  index === 2 && "bg-gradient-to-r from-orange-50/50 to-transparent"
                )}
              >
                <span className="w-5 text-center text-sm">{getRankBadge(index + 1)}</span>
                <Avatar className="h-7 w-7 border">
                  <AvatarImage src={sponsor.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {(sponsor.displayName || sponsor.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-semibold text-[#7A2BFF] truncate">
                  {sponsor.displayName || sponsor.username}
                </span>
                <span className="text-sm font-bold text-[#FFD700]">
                  {formatNumber(sponsor.totalDonated)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Donate Button */}
        <Button
          onClick={onDonate}
          className="w-full mt-3 bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF]
            text-white font-bold text-sm
            shadow-[0_0_15px_rgba(255,0,229,0.3)]
            hover:shadow-[0_0_25px_rgba(122,43,255,0.5)]
            border-0 rounded-full"
        >
          <Heart className="h-4 w-4 mr-2 fill-white" />
          Donate to Project
        </Button>
      </motion.div>

      {/* Extended Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="border-t border-[#00E7FF]/30 pt-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-[#00E7FF]" />
          <span className="font-medium">Chi tiết thêm:</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[#F0FDFF] to-[#FFF8F0]">
            <span className="text-muted-foreground text-xs">CAMLY Distributed:</span>
            <span className="font-bold text-[#7A2BFF]">{formatNumber(stats.totalRewards)}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-[#F0FDFF] to-[#FFF8F0]">
            <span className="text-muted-foreground text-xs">Subscriptions:</span>
            <span className="font-bold text-[#7A2BFF]">{formatNumber(stats.totalSubscriptions)}</span>
          </div>
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
  const { users: ranking, loading: rankingLoading } = useTopRanking(5);
  const { sponsors, loading: sponsorsLoading } = useTopSponsors(5);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleDonate = () => {
    onClose();
    navigate("/wallet");
  };

  // Mobile: Use Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] rounded-t-3xl bg-gradient-to-b from-white to-[#F0FDFF] border-t-2 border-[#00E7FF]/50"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Honor Board</SheetTitle>
          </SheetHeader>
          <div className="pt-4 pb-8 overflow-y-auto max-h-full">
            <ModalContent 
              stats={stats} 
              loading={loading} 
              ranking={ranking}
              rankingLoading={rankingLoading}
              sponsors={sponsors}
              sponsorsLoading={sponsorsLoading}
              onDonate={handleDonate}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog (centered modal)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-[#F0FDFF] to-[#FFF8F0] 
          border-2 border-[#00E7FF]/50
          shadow-[0_0_40px_rgba(0,231,255,0.3),0_0_80px_rgba(122,43,255,0.2)]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Honor Board</DialogTitle>
        </DialogHeader>
        <ModalContent 
          stats={stats} 
          loading={loading} 
          ranking={ranking}
          rankingLoading={rankingLoading}
          sponsors={sponsors}
          sponsorsLoading={sponsorsLoading}
          onDonate={handleDonate}
        />
      </DialogContent>
    </Dialog>
  );
};
