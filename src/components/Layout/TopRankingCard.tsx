import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLightCommunity, LightCommunityMember } from "@/hooks/useLightCommunity";
import { getLightLevelLabel, getLightLevelEmoji } from "@/lib/fun-money/pplp-engine";

interface LightMemberItemProps {
  member: LightCommunityMember;
  index: number;
}

const LightMemberItem = ({ member, index }: LightMemberItemProps) => {
  const navigate = useNavigate();
  const level = member.light_level || "presence";
  const emoji = getLightLevelEmoji(level);
  const label = getLightLevelLabel(level);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      whileHover={{ x: 4, scale: 1.01 }}
      onClick={() => navigate(`/${member.username || member.id}`)}
      className={cn(
        "w-full flex items-center gap-1.5 px-1.5 py-1 rounded-lg transition-all duration-300",
        "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))]/5 to-[hsl(var(--cosmic-purple))]/5",
        "border border-[hsl(var(--cosmic-purple))]/20",
        "hover:shadow-[0_0_15px_rgba(122,43,255,0.3)]"
      )}
    >
      {/* Emoji */}
      <span className="text-sm min-w-[24px] shrink-0">{emoji}</span>

      {/* Avatar */}
      <Avatar className="h-7 w-7 border-2 shrink-0 border-[hsl(var(--cosmic-purple))]/50">
        <AvatarImage src={member.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] text-white text-[9px] font-bold">
          {(member.display_name || member.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className="flex-1 text-left text-[11px] font-semibold text-[hsl(var(--cosmic-purple))] truncate max-w-[70px]">
        {member.display_name || member.username}
      </span>

      {/* Light Level */}
      <span className="text-[10px] font-medium text-muted-foreground shrink-0 truncate max-w-[80px]">
        {label}
      </span>
    </motion.button>
  );
};

interface TopRankingCardProps {
  className?: string;
}

export const TopRankingCard = ({ className }: TopRankingCardProps) => {
  const navigate = useNavigate();
  const { members, loading, refetch } = useLightCommunity(5);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
      <div className="flex items-center justify-center gap-1.5 mb-3 relative">
        <Sparkles className="h-4 w-4 text-[hsl(var(--cosmic-gold))] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        <h2 className="text-base font-black italic bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
          LIGHT COMMUNITY
        </h2>
        <button onClick={handleRefresh} className="absolute right-0 p-1 rounded-full hover:bg-muted/50 transition-colors" title="Cập nhật">
          <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Community List */}
      <div className="space-y-1.5">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted animate-pulse">
              <div className="w-7 h-4 rounded bg-muted-foreground/20" />
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 h-3 rounded bg-muted-foreground/20" />
            </div>
          ))
        ) : members.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-3">
            Chưa có dữ liệu cộng đồng
          </p>
        ) : (
          members.map((member, index) => (
            <LightMemberItem key={member.id} member={member} index={index} />
          ))
        )}
      </div>

      {/* View All Button */}
      <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
        <Button
          onClick={() => navigate("/leaderboard")}
          variant="ghost"
          className="w-full h-8 text-xs text-[hsl(var(--cosmic-purple))] hover:text-[hsl(var(--cosmic-magenta))] hover:bg-[hsl(var(--cosmic-purple))]/10 font-semibold"
        >
          Xem Light Community
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
