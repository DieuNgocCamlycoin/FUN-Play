import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTopRanking, LeaderboardUser } from "@/hooks/useTopRanking";

const getRankBadge = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const formatRewards = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

interface RankingItemProps {
  rank: number;
  user: LeaderboardUser;
  index: number;
}

const RankingItem = ({ rank, user, index }: RankingItemProps) => {
  const navigate = useNavigate();
  const isTopThree = rank <= 3;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      whileHover={{ x: 4, scale: 1.01 }}
      onClick={() => navigate(`/channel/${user.id}`)}
      className={cn(
        "w-full flex items-center gap-1.5 px-1.5 py-1 rounded-lg transition-all duration-300",
        isTopThree 
          ? "bg-gradient-to-r from-[#7A2BFF]/10 via-[#FF00E5]/10 to-[#FFD700]/15 border border-[#FFD700]/30"
          : "bg-gradient-to-r from-[#00E7FF]/5 to-[#7A2BFF]/5 border border-[#7A2BFF]/20",
        "hover:shadow-[0_0_15px_rgba(122,43,255,0.3)]"
      )}
    >
      {/* Rank Badge */}
      <span className="text-sm font-bold min-w-[24px] shrink-0">{getRankBadge(rank)}</span>

      {/* Avatar */}
      <Avatar className={cn(
        "h-7 w-7 border-2 shrink-0",
        isTopThree ? "border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.5)]" : "border-[#7A2BFF]/50"
      )}>
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-[#7A2BFF] to-[#FF00E5] text-white text-[9px] font-bold">
          {(user.display_name || user.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className="flex-1 text-left text-[11px] font-semibold text-[#7A2BFF] truncate max-w-[70px]">
        {user.display_name || user.username}
      </span>

      {/* CAMLY Amount */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Coins className="h-3 w-3 text-[#FFD700] shrink-0" />
        <span className="text-[11px] font-black text-[#FFD700]">
          {formatRewards(user.total_camly_rewards)}
        </span>
      </div>
    </motion.button>
  );
};

interface TopRankingCardProps {
  className?: string;
}

export const TopRankingCard = ({ className }: TopRankingCardProps) => {
  const navigate = useNavigate();
  const { users, loading } = useTopRanking(5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
      className={cn(
        "relative p-3 rounded-2xl",
        "bg-white/85 backdrop-blur-xl",
        "border-2 border-transparent",
        "shadow-[0_0_30px_rgba(0,231,255,0.3)]",
        "hover:shadow-[0_0_50px_rgba(122,43,255,0.5)]",
        "transition-all duration-500",
        className
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <Trophy className="h-4 w-4 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        <h2 className="text-base font-black italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
          TOP RANKING
        </h2>
      </div>

      {/* Ranking List */}
      <div className="space-y-1.5">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted animate-pulse"
            >
              <div className="w-7 h-4 rounded bg-muted-foreground/20" />
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 h-3 rounded bg-muted-foreground/20" />
              <div className="w-10 h-3 rounded bg-muted-foreground/20" />
            </div>
          ))
        ) : users.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-3">
            No ranking data yet
          </p>
        ) : (
          users.map((user, index) => (
            <RankingItem key={user.id} rank={index + 1} user={user} index={index} />
          ))
        )}
      </div>

      {/* View All Button */}
      <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
        <Button
          onClick={() => navigate("/leaderboard")}
          variant="ghost"
          className="w-full h-8 text-xs text-[#7A2BFF] hover:text-[#FF00E5] hover:bg-[#7A2BFF]/10 font-semibold"
        >
          View All Ranking
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
