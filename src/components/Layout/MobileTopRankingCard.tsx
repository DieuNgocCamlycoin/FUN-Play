import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLightCommunity, LightCommunityMember } from "@/hooks/useLightCommunity";
import { getLightLevelEmoji } from "@/lib/fun-money/pplp-engine";

interface MiniLightPillProps {
  member: LightCommunityMember;
}

const MiniLightPill = ({ member }: MiniLightPillProps) => {
  const navigate = useNavigate();
  const level = member.light_level || "presence";
  const emoji = getLightLevelEmoji(level);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); navigate(`/${member.username || member.id}`); }}
      className={cn(
        "cursor-pointer",
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))]/10 via-[hsl(var(--cosmic-purple))]/10 to-[hsl(var(--cosmic-magenta))]/10",
        "border border-[hsl(var(--cosmic-purple))]/30"
      )}
    >
      <span className="text-xs">{emoji}</span>
      <Avatar className="h-5 w-5 border border-[hsl(var(--cosmic-purple))]/30">
        <AvatarImage src={member.avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-gradient-to-br from-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] text-white">
          {(member.display_name || member.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-bold text-[hsl(var(--cosmic-purple))] truncate max-w-[60px]">
        {member.display_name || member.username}
      </span>
    </div>
  );
};

export const MobileTopRankingCard = () => {
  const navigate = useNavigate();
  const { members, loading, refetch } = useLightCommunity(3);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "w-full p-3 rounded-xl text-left",
        "bg-white/85 backdrop-blur-lg",
        "border-2 border-transparent",
        "shadow-[0_0_20px_rgba(0,231,255,0.2)]",
        "transition-all duration-300"
      )}
      style={{
        background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box",
      }}
    >
      <button onClick={() => navigate("/leaderboard")} className="w-full text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--cosmic-gold))] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
            <span className="font-black text-sm italic bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-gold))] bg-clip-text text-transparent">
              LIGHT COMMUNITY
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRefresh} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
              <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", refreshing && "animate-spin")} />
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Top 3 Preview */}
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted animate-pulse">
                <div className="w-4 h-4 rounded-full bg-muted-foreground/20" />
                <div className="w-8 h-3 rounded bg-muted-foreground/20" />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Chưa có dữ liệu cộng đồng</p>
        ) : (
          <div className="flex items-center gap-2 py-2 flex-wrap">
            {members.slice(0, 3).map((member) => (
              <MiniLightPill key={member.id} member={member} />
            ))}
          </div>
        )}

        {/* View All */}
        <div className="pt-2 border-t border-[hsl(var(--cosmic-purple))]/20 text-center">
          <span className="text-xs text-[hsl(var(--cosmic-purple))] font-medium">
            Xem Light Community →
          </span>
        </div>
      </button>
    </motion.div>
  );
};
