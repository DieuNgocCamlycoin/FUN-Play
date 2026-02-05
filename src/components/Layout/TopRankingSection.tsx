import { useNavigate } from "react-router-dom";
import { Trophy, Coins, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { useTopRanking, LeaderboardUser } from "@/hooks/useTopRanking";

const getRankBadge = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const getRankBorderClass = (rank: number): string => {
  if (rank === 1) return "border-[#FFD700] ring-2 ring-[rgba(255,215,0,0.3)] shadow-[0_0_15px_rgba(255,215,0,0.5),0_0_25px_rgba(0,231,255,0.3)]";
  if (rank === 2) return "border-gray-400";
  if (rank === 3) return "border-orange-400";
  return "border-border";
};

interface RankingItemProps {
  user: LeaderboardUser;
  rank: number;
}

const RankingItem = ({ user, rank }: RankingItemProps) => {
  const navigate = useNavigate();

  const formatRewards = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ x: 4, scale: 1.02 }}
      onClick={() => navigate(`/channel/${user.id}`)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer",
        "hover:bg-[#F0FDFF]",
        rank === 1 && "bg-gradient-to-r from-[#FFF8E1] to-transparent border border-[#FFD700]/30",
        rank === 2 && "bg-gradient-to-r from-gray-100/50 to-transparent",
        rank === 3 && "bg-gradient-to-r from-orange-50/50 to-transparent"
      )}
    >
      {/* Rank Badge */}
      <span className="w-6 text-center font-medium text-sm">
        {getRankBadge(rank)}
      </span>

      {/* Avatar */}
      <Avatar className={cn("h-7 w-7 border-2", getRankBorderClass(rank))}>
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-gradient-to-br from-[#F0FDFF] to-[#FFF8F0]">
          {(user.display_name || user.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-[#7A2BFF]">
          {user.display_name || user.username}
        </p>
      </div>

      {/* CAMLY Value */}
      <div className="text-right flex items-center gap-0.5">
        <span className="text-xs font-bold text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">
          {formatRewards(user.total_camly_rewards)}
        </span>
        <span className="text-[10px] text-muted-foreground">CAMLY</span>
      </div>
    </motion.div>
  );
};

export const TopRankingSection = () => {
  const navigate = useNavigate();
  const { users, loading } = useTopRanking(5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="p-3 rounded-xl bg-gradient-to-br from-[#F0FDFF] via-white to-[#FFF8F0] border border-[#00E7FF]/25 mt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#FFD700]" />
          Top 5 Ranking
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Coins className="h-3 w-3 text-[#FFD700]" />
          CAMLY Rewards
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
              <div className="w-6 h-4 rounded bg-muted" />
              <div className="w-7 h-7 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-20" />
              </div>
              <div className="h-3 bg-muted rounded w-12" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No ranking data yet
        </p>
      ) : (
        <div className="space-y-1">
          {users.map((user, index) => (
            <RankingItem key={user.id} user={user} rank={index + 1} />
          ))}
        </div>
      )}

      {/* View All Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/leaderboard")}
        className="w-full mt-3 text-xs bg-gradient-to-r from-[#00E7FF]/10 to-[#FFD700]/10 
          hover:from-[#00E7FF]/20 hover:to-[#FFD700]/20
          border border-[#00E7FF]/30 hover:border-[#7A2BFF]/50
          transition-all duration-300"
      >
        View All Ranking
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </motion.div>
  );
};
