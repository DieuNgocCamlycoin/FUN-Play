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

interface MiniSponsorPillProps {
  rank: number;
  sponsor: TopSponsor;
}

const MiniSponsorPill = ({ rank, sponsor }: MiniSponsorPillProps) => {
  const navigate = useNavigate();
  return (
  <div
    onClick={() => navigate(`/${sponsor.username || sponsor.userId}`)}
    className={cn(
      "cursor-pointer",
      "flex items-center gap-1.5 px-2 py-1 rounded-full",
      "bg-gradient-to-r from-[#FF00E5]/10 via-[#7A2BFF]/10 to-[#00E7FF]/10",
      "border border-[#FF00E5]/30",
      rank === 1 && "border-[#FFD700]/50 bg-gradient-to-r from-[#FFD700]/15 to-[#FF00E5]/10"
    )}
  >
    <span className="text-xs">{getRankBadge(rank)}</span>
    <Avatar className="h-5 w-5 border border-[#FF00E5]/30">
      <AvatarImage src={sponsor.avatarUrl || undefined} />
      <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#FF00E5] to-[#7A2BFF] text-white">
        {(sponsor.displayName || sponsor.username).charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <span className="text-xs font-bold text-[#FFD700]">
      {formatAmount(sponsor.totalDonated)}
    </span>
  </div>
  );
};

export const MobileTopSponsorsCard = () => {
  const navigate = useNavigate();
  const { sponsors, loading } = useTopSponsors(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn(
        "w-full p-3 rounded-xl",
        "bg-white/85 backdrop-blur-lg",
        "border-2 border-transparent",
        "shadow-[0_0_20px_rgba(255,0,229,0.2)]",
        "transition-all duration-300"
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #FF00E5, #7A2BFF, #00E7FF) border-box",
      }}
    >
      {/* Header */}
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
          onClick={() => navigate("/wallet")}
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
    </motion.div>
  );
};
