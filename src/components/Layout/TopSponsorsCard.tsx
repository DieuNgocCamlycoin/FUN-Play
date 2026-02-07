import { useNavigate } from "react-router-dom";
import { Gem, Heart, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTopSponsors, TopSponsor } from "@/hooks/useTopSponsors";

const getRankBadge = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const formatAmount = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

interface SponsorItemProps {
  rank: number;
  sponsor: TopSponsor;
  index: number;
}

const SponsorItem = ({ rank, sponsor, index }: SponsorItemProps) => {
  const navigate = useNavigate();
  const isTopThree = rank <= 3;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      whileHover={{ x: 6, scale: 1.02 }}
      onClick={() => navigate(`/channel/${sponsor.userId}`)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-300 overflow-hidden",
        isTopThree 
          ? "bg-gradient-to-r from-[#FF00E5]/10 via-[#7A2BFF]/10 to-[#00E7FF]/15 border border-[#FF00E5]/30"
          : "bg-gradient-to-r from-[#FF00E5]/5 to-[#7A2BFF]/5 border border-[#FF00E5]/20",
        "hover:shadow-[0_0_20px_rgba(255,0,229,0.3)]"
      )}
    >
      {/* Rank Badge */}
      <span className="text-base font-bold min-w-[28px]">{getRankBadge(rank)}</span>

      {/* Avatar */}
      <Avatar className={cn(
        "h-8 w-8 border-2",
        isTopThree ? "border-[#FF00E5] shadow-[0_0_12px_rgba(255,0,229,0.5)]" : "border-[#FF00E5]/50"
      )}>
        <AvatarImage src={sponsor.avatarUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-[#FF00E5] to-[#7A2BFF] text-white text-[10px] font-bold">
          {(sponsor.displayName || sponsor.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className="flex-1 text-left text-xs font-semibold text-[#FF00E5] truncate">
        {sponsor.displayName || sponsor.username}
      </span>

      {/* Amount */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Coins className="h-3 w-3 text-[#FFD700]" />
        <span className="text-xs font-black text-[#FFD700]">
          {formatAmount(sponsor.totalDonated)}
        </span>
      </div>
    </motion.button>
  );
};

interface TopSponsorsCardProps {
  className?: string;
}

export const TopSponsorsCard = ({ className }: TopSponsorsCardProps) => {
  const navigate = useNavigate();
  const { sponsors, loading } = useTopSponsors(5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
      className={cn(
        "relative p-4 rounded-2xl overflow-hidden",
        "bg-white/85 backdrop-blur-xl",
        "border-2 border-transparent",
        "shadow-[0_0_30px_rgba(255,0,229,0.3)]",
        "hover:shadow-[0_0_50px_rgba(255,0,229,0.5)]",
        "transition-all duration-500",
        className
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #FF00E5, #7A2BFF, #00E7FF) border-box",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <Gem className="h-4 w-4 text-[#FF00E5] drop-shadow-[0_0_10px_rgba(255,0,229,0.8)]" />
        <h2 className="text-base font-black italic bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF] bg-clip-text text-transparent">
          TOP SPONSORS
        </h2>
      </div>

      {/* Sponsors List */}
      <div className="space-y-1.5">
        {loading ? (
          [...Array(3)].map((_, i) => (
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
        ) : sponsors.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-3">
            No sponsors yet
          </p>
        ) : (
          sponsors.map((sponsor, index) => (
            <SponsorItem key={sponsor.userId} rank={index + 1} sponsor={sponsor} index={index} />
          ))
        )}
      </div>

      {/* Donate Button */}
      <motion.div whileTap={{ scale: 0.97 }} className="mt-3">
        <Button
          onClick={() => navigate("/wallet")}
          className="w-full bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF]
            text-white text-xs font-bold
            shadow-[0_0_20px_rgba(255,0,229,0.4)]
            hover:shadow-[0_0_30px_rgba(122,43,255,0.6)]
            border-0 rounded-full h-9"
        >
          <Heart className="h-3.5 w-3.5 mr-1.5 fill-white" />
          Donate to Project
        </Button>
      </motion.div>
    </motion.div>
  );
};
