import { useNavigate } from "react-router-dom";
import { Trophy, Coins, ChevronRight, Gem, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { useTopRanking, LeaderboardUser } from "@/hooks/useTopRanking";
import { useTopSponsors } from "@/hooks/useTopSponsors";

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

const formatRewards = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

interface RankingItemProps {
  user: LeaderboardUser;
  rank: number;
}

const RankingItem = ({ user, rank }: RankingItemProps) => {
  const navigate = useNavigate();

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
        <p className="text-sm font-semibold truncate text-[#7A2BFF]">
          {user.display_name || user.username}
        </p>
      </div>

      {/* CAMLY Value */}
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">
          {formatRewards(user.total_camly_rewards)}
        </span>
      </div>
    </motion.div>
  );
};

interface TopRankingSectionProps {
  showSponsors?: boolean;
}

export const TopRankingSection = ({ showSponsors = false }: TopRankingSectionProps) => {
  const navigate = useNavigate();
  const { users, loading } = useTopRanking(5);
  const { sponsors, loading: sponsorsLoading } = useTopSponsors(showSponsors ? 5 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="p-3 rounded-xl bg-gradient-to-br from-[#F0FDFF] via-white to-[#FFF8F0] border border-[#00E7FF]/25 mt-4"
    >
      {/* Top 5 Ranking Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#FFD700]" />
          Top 5 Ranking
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Coins className="h-3 w-3 text-[#FFD700]" />
          CAMLY
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

      {/* Top Sponsors Section (when showSponsors is true) */}
      {showSponsors && (
        <>
          <div className="mt-4 pt-4 border-t border-[#00E7FF]/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Gem className="h-4 w-4 text-[#FF00E5]" />
                Top Sponsors
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3 w-3 text-[#FFD700]" />
                Tips
              </div>
            </div>

            {sponsorsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div className="flex-1 h-3 bg-muted rounded w-20" />
                    <div className="h-3 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            ) : sponsors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                No sponsors yet
              </p>
            ) : (
              <div className="space-y-1">
                {sponsors.map((sponsor, index) => (
                  <motion.div
                    key={sponsor.userId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    onClick={() => navigate(`/channel/${sponsor.userId}`)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer",
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
                      "h-7 w-7 border-2",
                      index === 0 && "border-[#FFD700] ring-1 ring-[rgba(255,215,0,0.3)]",
                      index === 1 && "border-gray-400",
                      index === 2 && "border-orange-400",
                      index > 2 && "border-border"
                    )}>
                      <AvatarImage src={sponsor.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-[#F0FDFF] to-[#FFF8F0]">
                        {(sponsor.displayName || sponsor.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-[#7A2BFF]">
                        {sponsor.displayName || sponsor.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#FFD700] drop-shadow-[0_0_3px_rgba(255,215,0,0.4)]">
                        {formatRewards(sponsor.totalDonated)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Donate Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-3"
            >
              <Button
                onClick={() => navigate("/wallet")}
                className="w-full bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF]
                  text-white font-bold text-xs
                  shadow-[0_0_15px_rgba(255,0,229,0.3)]
                  hover:shadow-[0_0_25px_rgba(122,43,255,0.5)]
                  border-0 rounded-full py-2"
              >
                <Heart className="h-4 w-4 mr-2 fill-white" />
                Donate to Project
              </Button>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};