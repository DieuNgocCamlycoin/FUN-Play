import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  FileText, 
  Users, 
  Heart, 
  Image, 
  MessageSquare, 
  Share2, 
  Gift, 
  CheckCircle, 
  Coins, 
  Gem,
  Sparkles
} from "lucide-react";

interface ProfileHonorBoardProps {
  userId: string;
}

interface HonorStats {
  posts: number;
  friends: number;
  reactions: number;
  nfts: number;
  comments: number;
  shares: number;
  claimable: number;
  claimed: number;
  totalReward: number;
  totalMoney: number;
}

export const ProfileHonorBoard = ({ userId }: ProfileHonorBoardProps) => {
  const [stats, setStats] = useState<HonorStats>({
    posts: 0,
    friends: 0,
    reactions: 0,
    nfts: 0,
    comments: 0,
    shares: 0,
    claimable: 0,
    claimed: 0,
    totalReward: 0,
    totalMoney: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHonorStats();
  }, [userId]);

  const fetchHonorStats = async () => {
    try {
      const [
        postsRes,
        commentsRes,
        profileRes,
        likesRes,
      ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("profiles").select("total_camly_rewards, pending_rewards, approved_reward").eq("id", userId).single(),
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const { data: channelData } = await supabase
        .from("channels")
        .select("subscriber_count")
        .eq("user_id", userId)
        .single();

      const friendsCount = channelData?.subscriber_count || 0;
      const totalReward = profileRes.data?.total_camly_rewards || 0;
      const approved = profileRes.data?.approved_reward || 0;

      setStats({
        posts: postsRes.count || 0,
        friends: friendsCount,
        reactions: likesRes.count || 0,
        nfts: 0,
        comments: commentsRes.count || 0,
        shares: 0,
        claimable: approved,
        claimed: totalReward,
        totalReward: totalReward,
        totalMoney: totalReward * 0.001,
      });
    } catch (error) {
      console.error("Error fetching honor stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const statItems = [
    { icon: FileText, label: "Posts", value: stats.posts },
    { icon: Users, label: "Friends", value: stats.friends },
    { icon: Heart, label: "Reactions", value: stats.reactions },
    { icon: Image, label: "NFTs", value: stats.nfts },
    { icon: MessageSquare, label: "Comments", value: stats.comments },
    { icon: Share2, label: "Shares", value: stats.shares },
    { icon: Gift, label: "Claimable", value: stats.claimable, isCamly: true },
    { icon: CheckCircle, label: "Claimed", value: stats.claimed, isCamly: true },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-3 right-3 md:top-4 md:right-4 z-20 w-[260px] md:w-[300px]"
      >
        <div className="honor-board-compact">
          <div className="honor-board-inner-compact p-3">
            <div className="h-4 w-32 mx-auto bg-amber-200/50 rounded animate-pulse mb-3" />
            <div className="grid grid-cols-2 gap-1.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 bg-amber-100/50 rounded animate-pulse" />
              ))}
            </div>
            <div className="mt-2 h-12 bg-amber-100/50 rounded animate-pulse" />
            <div className="mt-1.5 h-12 bg-emerald-100/50 rounded animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
      className="absolute top-3 right-3 md:top-4 md:right-4 z-20 w-[260px] md:w-[300px]"
    >
      {/* Gold Premium Border Container */}
      <div className="honor-board-compact relative overflow-hidden group hover:shadow-[0_6px_30px_rgba(251,191,36,0.5)] transition-shadow duration-300">
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        />
        
        {/* Glass Inner Container */}
        <div className="honor-board-inner-compact relative p-2.5 md:p-3">
          
          {/* Header */}
          <div className="flex items-center justify-center gap-1.5 mb-2 pb-1.5 border-b border-amber-300/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              ♦ Honor Board ♦
            </h2>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>

          {/* 2-Column Stats Grid */}
          <div className="grid grid-cols-2 gap-1 md:gap-1.5">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between px-1.5 py-1 rounded-md bg-gradient-to-r from-amber-50/80 to-yellow-50/80 hover:from-amber-100 hover:to-yellow-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3 text-amber-600/80" />
                    <span className="text-[10px] md:text-[11px] font-medium text-amber-800/70 uppercase">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-amber-900">
                    {formatNumber(item.value)}
                    {item.isCamly && <span className="text-[8px] ml-0.5 text-amber-600">C</span>}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Total Reward Section */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 p-2 rounded-lg bg-gradient-to-r from-amber-100/90 via-yellow-50/90 to-amber-100/90 border border-amber-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] md:text-[11px] font-semibold text-amber-700 uppercase">
                  Total Reward
                </span>
              </div>
              <span className="text-sm md:text-base font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                {formatNumber(stats.totalReward)}
              </span>
            </div>
            <div className="text-[9px] text-amber-600/70 mt-0.5 text-right">
              Chờ: {formatNumber(stats.claimable)} + Số dư: {formatNumber(stats.claimed)}
            </div>
          </motion.div>

          {/* Total Money Section */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-1.5 p-2 rounded-lg bg-gradient-to-r from-emerald-100/90 via-cyan-50/90 to-emerald-100/90 border border-emerald-200/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Gem className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] md:text-[11px] font-semibold text-emerald-700 uppercase">
                  Total Money
                </span>
              </div>
              <span className="text-sm md:text-base font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                ${stats.totalMoney.toFixed(2)}
              </span>
            </div>
            <div className="text-[9px] text-emerald-600/70 mt-0.5 text-right">
              ≈ {formatNumber(stats.totalReward)} CAMLY
            </div>
          </motion.div>
          
        </div>
      </div>
    </motion.div>
  );
};
