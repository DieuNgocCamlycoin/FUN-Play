import { useNavigate } from "react-router-dom";
import { Gem, Heart, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTopSponsors } from "@/hooks/useTopSponsors";
import { formatViewsShort } from "@/lib/formatters";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { cn } from "@/lib/utils";

const getRankBadge = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}.`;
};


export const TopSponsorSection = () => {
  const navigate = useNavigate();
  const { sponsors, loading } = useTopSponsors(5);

  const handleDonate = () => {
    // Navigate to wallet page for donations
    navigate("/wallet");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-4 p-3 rounded-xl
        bg-gradient-to-br from-[#F0FDFF] via-white to-[#FFF8F0]
        border border-[#00E7FF]/25"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
          <Gem className="h-4 w-4 text-[#FF00E5]" />
          Top Sponsors
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Coins className="h-3 w-3 text-[#FFD700]" />
          Donations
        </div>
      </div>

      {/* Sponsors List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-20" />
              </div>
              <div className="h-3 bg-muted rounded w-12" />
            </div>
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
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
              <span className="w-5 text-center font-medium text-sm">
                {getRankBadge(index + 1)}
              </span>
              <Avatar className={cn(
                "h-6 w-6 border-2",
                index === 0 && "border-[#FFD700] ring-1 ring-[rgba(255,215,0,0.3)] shadow-[0_0_10px_rgba(255,215,0,0.4)]",
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
                <span className="text-xs font-bold text-[#FFD700] drop-shadow-[0_0_3px_rgba(255,215,0,0.4)]">
                  {formatViewsShort(sponsor.totalDonated)}
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
          onClick={handleDonate}
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
    </motion.div>
  );
};
