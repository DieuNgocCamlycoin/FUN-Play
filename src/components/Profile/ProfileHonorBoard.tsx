import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Crown, FileText, Image, Video, Users, Coins, Gift, Gem } from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProfileHonorBoardProps {
  userId: string;
  placement?: "cover" | "below";
}

interface HonorStats {
  posts: number;
  photos: number;
  videos: number;
  friends: number;
  totalReward: number;
  claimable: number;
  totalMoney: number;
}

interface StatPillProps {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  index: number;
  prefix?: string;
}

const StatPill = ({ icon: Icon, label, value, loading, index, prefix }: StatPillProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
    whileHover={{ x: 4, scale: 1.01 }}
    className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg
      bg-white/90 border border-[#00E7FF]/30
      shadow-sm hover:shadow-[0_0_12px_rgba(0,231,255,0.3)] hover:border-[#00E7FF]/50
      hover:bg-[#00E7FF]/5 transition-all duration-200"
  >
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="h-3.5 w-3.5 text-[#7A2BFF] shrink-0" />
      <span className="text-[10px] font-semibold text-[#7A2BFF] uppercase tracking-wider truncate">
        {label}
      </span>
    </div>
    <span className="text-sm font-bold text-[#00E7FF] whitespace-nowrap shrink-0 ml-1">
      {loading ? "..." : (
        <>
          {prefix}
          <CounterAnimation value={value} duration={800} compact />
        </>
      )}
    </span>
  </motion.div>
);

export const ProfileHonorBoard = ({ userId, placement = "cover" }: ProfileHonorBoardProps) => {
  const [stats, setStats] = useState<HonorStats>({
    posts: 0,
    photos: 0,
    videos: 0,
    friends: 0,
    totalReward: 0,
    claimable: 0,
    totalMoney: 0,
  });
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchHonorStats();
  }, [userId]);

  const fetchHonorStats = async () => {
    try {
      const [postsRes, videosRes, photosRes, profileRes, channelRes] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("category", "photo"),
        supabase.from("profiles").select("total_camly_rewards, approved_reward").eq("id", userId).single(),
        supabase.from("channels").select("subscriber_count").eq("user_id", userId).single(),
      ]);

      const totalReward = profileRes.data?.total_camly_rewards || 0;
      const approved = profileRes.data?.approved_reward || 0;

      setStats({
        posts: postsRes.count || 0,
        photos: photosRes.count || 0,
        videos: videosRes.count || 0,
        friends: channelRes.data?.subscriber_count || 0,
        totalReward,
        claimable: approved,
        totalMoney: totalReward * 0.001,
      });
    } catch (error) {
      console.error("Error fetching honor stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if placement doesn't match device
  if (placement === "cover" && isMobile) return null;
  if (placement === "below" && !isMobile) return null;

  const statItems = [
    { icon: FileText, label: "POSTS", value: stats.posts },
    { icon: Image, label: "PHOTOS", value: stats.photos },
    { icon: Video, label: "VIDEOS", value: stats.videos },
    { icon: Users, label: "FRIENDS", value: stats.friends },
    { icon: Coins, label: "TOTAL REWARD", value: stats.totalReward },
    { icon: Gift, label: "CLAIMABLE", value: stats.claimable },
    { icon: Gem, label: "TOTAL MONEY", value: stats.totalMoney, prefix: "$" },
  ];

  const containerClass = placement === "cover"
    ? "absolute top-3 right-3 md:top-4 md:right-4 z-20 w-[280px]"
    : "w-full px-4 mt-3";

  return (
    <motion.div
      initial={{ opacity: 0, y: placement === "cover" ? -10 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className={containerClass}
    >
      <motion.div
        className={cn(
          "relative p-3 rounded-2xl",
          "bg-white/85 backdrop-blur-xl",
          "border-2 border-transparent",
          "shadow-[0_0_30px_rgba(0,231,255,0.3)]",
          "hover:shadow-[0_0_50px_rgba(122,43,255,0.5)]",
          "transition-all duration-500"
        )}
        style={{
          background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5) border-box",
        }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 opacity-0 hover:opacity-100 pointer-events-none"
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-center gap-1.5 mb-3">
          <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
            <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          </motion.div>
          <h2 className="text-lg font-black italic bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
            HONOR BOARD
          </h2>
          <motion.div animate={{ rotate: [5, -5, 5] }} transition={{ duration: 2, repeat: Infinity }}>
            <Crown className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          </motion.div>
        </div>

        {/* Stats */}
        <div className={cn(
          "relative",
          placement === "below" ? "grid grid-cols-2 gap-2" : "space-y-2"
        )}>
          {statItems.map((stat, index) => (
            <StatPill
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              loading={loading}
              index={index}
              prefix={stat.prefix}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
