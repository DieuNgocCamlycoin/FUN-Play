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
  Crown 
} from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

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
      // Fetch all stats in parallel
      const [
        postsRes,
        subscriptionsRes,
        commentsRes,
        profileRes,
        videosRes,
        likesRes,
      ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", userId),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("profiles").select("total_camly_rewards, pending_rewards, approved_reward").eq("id", userId).single(),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      // Get subscriber/friends count from channel
      const { count: friendsCount } = await supabase
        .from("channels")
        .select("subscriber_count")
        .eq("user_id", userId)
        .single()
        .then(res => ({ count: res.data?.subscriber_count || 0 }));

      const totalReward = profileRes.data?.total_camly_rewards || 0;
      const pending = profileRes.data?.pending_rewards || 0;
      const approved = profileRes.data?.approved_reward || 0;

      setStats({
        posts: postsRes.count || 0,
        friends: friendsCount || 0,
        reactions: likesRes.count || 0,
        nfts: 0, // NFTs not implemented yet
        comments: commentsRes.count || 0,
        shares: 0, // Shares tracking not implemented
        claimable: approved,
        claimed: totalReward,
        totalReward: totalReward,
        totalMoney: totalReward * 0.001, // Placeholder USD value
      });
    } catch (error) {
      console.error("Error fetching honor stats:", error);
    } finally {
      setLoading(false);
    }
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
    { icon: Coins, label: "Total Reward", value: stats.totalReward, isCamly: true },
    { icon: Gem, label: "Total Money", value: stats.totalMoney, isUSD: true },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-4 right-4 z-20 hidden lg:block"
      >
        <div className="p-3 rounded-xl bg-white/90 backdrop-blur-xl border-2 border-[hsl(var(--cosmic-cyan))]/40 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/20 to-[hsl(var(--cosmic-gold))]/20 rounded-lg h-10 w-24" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, x: 20 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="absolute top-4 right-4 z-20 hidden lg:block"
    >
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/30 to-[hsl(var(--cosmic-gold))]/30 blur-lg" />
        
        {/* Glass Card */}
        <div className="relative p-3 rounded-xl bg-white/95 backdrop-blur-xl border-2 border-[hsl(var(--cosmic-cyan))]/40 shadow-[0_4px_30px_rgba(0,231,255,0.3)]">
          {/* Header */}
          <div className="flex items-center justify-center gap-1.5 mb-2 pb-2 border-b border-[hsl(var(--cosmic-cyan))]/20">
            <Crown className="w-3.5 h-3.5 text-[hsl(var(--cosmic-gold))]" />
            <span className="text-xs font-bold bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent tracking-wide">
              HONOR BOARD
            </span>
            <Crown className="w-3.5 h-3.5 text-[hsl(var(--cosmic-gold))]" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/5 to-[hsl(var(--cosmic-gold))]/5 border border-[hsl(var(--cosmic-cyan))]/20 hover:border-[hsl(var(--cosmic-gold))]/40 transition-colors"
                >
                  <div className="p-1 rounded bg-gradient-to-br from-[hsl(var(--cosmic-cyan))]/15 to-[hsl(var(--cosmic-gold))]/15">
                    <Icon className="w-3 h-3 text-[hsl(var(--cosmic-cyan))]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] text-muted-foreground font-medium leading-none truncate">
                      {item.label}
                    </span>
                    <span className="text-xs font-bold bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-gold))] bg-clip-text text-transparent tabular-nums leading-tight">
                      <CounterAnimation value={item.value} decimals={item.isUSD ? 2 : 0} />
                      {item.isCamly && <span className="text-[7px] ml-0.5 text-[hsl(var(--cosmic-gold))]">CAMLY</span>}
                      {item.isUSD && <span className="text-[7px] ml-0.5 text-green-500">$</span>}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
