import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Sparkles, RefreshCw, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLightCommunity, LightCommunityMember } from "@/hooks/useLightCommunity";
import { getLightLevelLabel, getLightLevelEmoji } from "@/lib/fun-money/pplp-engine";

const LEVEL_STYLES: Record<string, string> = {
  presence: "from-emerald-400/20 to-emerald-600/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  contributor: "from-cyan-400/20 to-blue-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  builder: "from-violet-400/20 to-purple-500/20 border-violet-500/40 text-violet-700 dark:text-violet-300",
  guardian: "from-amber-400/20 to-orange-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
  architect: "from-yellow-300/20 to-amber-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300",
};

interface MemberCardProps {
  member: LightCommunityMember;
  index: number;
}

const MemberCard = ({ member, index }: MemberCardProps) => {
  const navigate = useNavigate();
  const level = member.light_level || "presence";
  const emoji = getLightLevelEmoji(level);
  const label = getLightLevelLabel(level);
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.presence;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => navigate(`/@${member.username}`)}
      className="cursor-pointer group"
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/5 via-[hsl(var(--cosmic-purple))]/5 to-[hsl(var(--cosmic-magenta))]/5 backdrop-blur-sm border-2 border-[hsl(var(--cosmic-purple))]/20 p-4 transition-all duration-300 hover:shadow-[0_0_25px_rgba(122,43,255,0.3)] hover:border-[hsl(var(--cosmic-purple))]/40">
        <div className="flex items-center gap-4 relative z-10">
          {/* Emoji */}
          <span className="text-2xl min-w-[36px] text-center">{emoji}</span>

          {/* Avatar */}
          <Avatar className="h-12 w-12 border-2 border-[hsl(var(--cosmic-purple))]/30 group-hover:border-[hsl(var(--cosmic-purple))]/60 transition-all duration-300 group-hover:scale-105">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] text-white font-bold">
              {(member.display_name || member.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Name & Username */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground truncate group-hover:text-[hsl(var(--cosmic-purple))] transition-colors">
              {member.display_name || member.username}
            </h3>
            <p className="text-sm text-muted-foreground">@{member.username}</p>
          </div>

          {/* Light Level Badge */}
          <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md bg-gradient-to-r ${style} text-xs font-bold whitespace-nowrap`}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Leaderboard() {
  const { members, loading, refetch } = useLightCommunity(20);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Đang tải Light Community...</div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative"
        >
          <div className="absolute left-0 top-0"><BackButton /></div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-[hsl(var(--cosmic-gold))] animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
            <h1 className="text-3xl md:text-4xl font-black italic bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
              LIGHT COMMUNITY
            </h1>
            <Users className="w-10 h-10 text-[hsl(var(--cosmic-purple))] drop-shadow-[0_0_15px_rgba(122,43,255,0.5)]" />
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Những người đóng góp bền vững trong hệ sinh thái FUN Play
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="absolute top-0 right-0 gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Cập nhật
          </Button>
        </motion.div>

        {/* Community Members */}
        <div className="space-y-3">
          {members.map((member, index) => (
            <MemberCard key={member.id} member={member} index={index} />
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            Chưa có dữ liệu cộng đồng
          </div>
        )}
      </div>
    </MainLayout>
  );
}
