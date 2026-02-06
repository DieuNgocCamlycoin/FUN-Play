import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight, Coins, Gem, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTopRanking, LeaderboardUser } from "@/hooks/useTopRanking";
import { useTopSponsors, TopSponsor } from "@/hooks/useTopSponsors";

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

interface MiniRankPillProps {
  rank: number;
  user: LeaderboardUser | undefined;
}

const MiniRankPill = ({ rank, user }: MiniRankPillProps) => {
  if (!user) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-gradient-to-r from-[#00E7FF]/10 via-[#7A2BFF]/10 to-[#FF00E5]/10",
        "border border-[#00E7FF]/30",
        rank === 1 && "border-[#FFD700]/50 bg-gradient-to-r from-[#FFD700]/15 to-[#00E7FF]/10"
      )}
    >
      <span className="text-xs">{getRankBadge(rank)}</span>
      <Avatar className="h-5 w-5 border border-[#7A2BFF]/30">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">
          {(user.display_name || user.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-bold text-[#FFD700]">
        {formatRewards(user.total_camly_rewards)}
      </span>
    </div>
  );
};

interface MiniSponsorPillProps {
  rank: number;
  sponsor: TopSponsor;
}

const MiniSponsorPill = ({ rank, sponsor }: MiniSponsorPillProps) => (
  <div
    className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full",
      "bg-gradient-to-r from-[#FF00E5]/10 via-[#7A2BFF]/10 to-[#00E7FF]/10",
      "border border-[#FF00E5]/30",
      rank === 1 && "border-[#FFD700]/50 bg-gradient-to-r from-[#FFD700]/15 to-[#FF00E5]/10"
    )}
  >
    <span className="text-xs">{getRankBadge(rank)}</span>
    <Avatar className="h-5 w-5 border border-[#FF00E5]/30">
      <AvatarImage src={sponsor.avatarUrl || undefined} />
      <AvatarFallback className="text-[10px]">
        {(sponsor.displayName || sponsor.username).charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <span className="text-xs font-bold text-[#FFD700]">
      {formatRewards(sponsor.totalDonated)}
    </span>
  </div>
);

export const MobileTopRankingCard = () => {
  const navigate = useNavigate();
  const { users, loading } = useTopRanking(3);
  const { sponsors, loading: sponsorsLoading } = useTopSponsors(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "w-full p-3 rounded-xl text-left",
        "bg-gradient-to-r from-white via-[#F0FDFF] to-[#FFF8F0]",
        "border border-[#00E7FF]/40",
        "shadow-[0_0_20px_rgba(0,231,255,0.15)]",
        "transition-all duration-300"
      )}
    >
      {/* Top Ranking Section */}
      <button
        onClick={() => navigate("/leaderboard")}
        className="w-full text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
            <span className="font-black text-sm italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent">
              TOP RANKING
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-[#FFD700]" />
            <span className="text-xs text-muted-foreground">CAMLY</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Top 3 Preview */}
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted animate-pulse"
              >
                <div className="w-4 h-4 rounded-full bg-muted-foreground/20" />
                <div className="w-8 h-3 rounded bg-muted-foreground/20" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No ranking data yet</p>
        ) : (
          <div className="flex items-center gap-2 py-2 flex-wrap">
            {users.slice(0, 3).map((user, index) => (
              <MiniRankPill key={user.id} rank={index + 1} user={user} />
            ))}
          </div>
        )}

        {/* View All Text */}
        <div className="pt-2 border-t border-[#00E7FF]/20 text-center">
          <span className="text-xs text-[#7A2BFF] font-medium">
            View All Ranking →
          </span>
        </div>
      </button>

      {/* Top Sponsors Section */}
      <div className="mt-3 pt-3 border-t border-[#FF00E5]/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-[#FF00E5]" />
            <span className="font-black text-xs italic bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF] bg-clip-text text-transparent">
              TOP SPONSORS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-[#FFD700]" />
            <span className="text-xs text-muted-foreground">Tips</span>
          </div>
        </div>

        {sponsorsLoading ? (
          <div className="flex items-center gap-2 py-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted animate-pulse"
              >
                <div className="w-4 h-4 rounded-full bg-muted-foreground/20" />
                <div className="w-8 h-3 rounded bg-muted-foreground/20" />
              </div>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No sponsors yet</p>
        ) : (
          <div className="flex items-center gap-2 py-2 flex-wrap">
            {sponsors.slice(0, 3).map((sponsor, index) => (
              <MiniSponsorPill key={sponsor.userId} rank={index + 1} sponsor={sponsor} />
            ))}
          </div>
        )}

        {/* Donate Button */}
        <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/wallet");
            }}
            className="w-full bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF]
              text-white font-bold text-xs
              shadow-[0_0_12px_rgba(255,0,229,0.3)]
              hover:shadow-[0_0_20px_rgba(122,43,255,0.5)]
              border-0 rounded-full py-1.5 h-8"
          >
            <Heart className="h-3.5 w-3.5 mr-1.5 fill-white" />
            Donate to Project
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
