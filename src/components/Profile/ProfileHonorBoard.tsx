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
  Crown,
  Sparkles
} from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const statItems = [
    { icon: FileText, label: "Posts", value: stats.posts, tooltip: "Số bài viết đã đăng" },
    { icon: Users, label: "Friends", value: stats.friends, tooltip: "Số bạn bè / người theo dõi" },
    { icon: Heart, label: "Reactions", value: stats.reactions, tooltip: "Tổng lượt thích" },
    { icon: Image, label: "NFTs", value: stats.nfts, tooltip: "NFT sở hữu" },
    { icon: MessageSquare, label: "Comments", value: stats.comments, tooltip: "Số bình luận" },
    { icon: Share2, label: "Shares", value: stats.shares, tooltip: "Lượt chia sẻ" },
    { icon: Gift, label: "Claimable", value: stats.claimable, isCamly: true, tooltip: "CAMLY có thể nhận" },
    { icon: CheckCircle, label: "Claimed", value: stats.claimed, isCamly: true, tooltip: "CAMLY đã nhận" },
    { icon: Coins, label: "Total Reward", value: stats.totalReward, isCamly: true, tooltip: "Tổng CAMLY kiếm được" },
    { icon: Gem, label: "Total Money", value: stats.totalMoney, isUSD: true, tooltip: "Giá trị ước tính (USD)" },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-20 w-[95%] md:w-[90%] max-w-[750px]"
      >
        <div className="honor-board-border">
          <div className="honor-board-inner p-4 lg:p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-center gap-3 mb-4 pb-3 border-b border-white/20">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-pink-300/30 to-purple-300/30 animate-pulse" />
              <div className="w-40 h-8 rounded bg-gradient-to-r from-cyan-300/30 to-purple-300/30 animate-pulse" />
              <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-300/30 to-pink-300/30 animate-pulse" />
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-gradient-to-br from-pink-300/20 via-purple-300/20 to-cyan-300/20 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-20 w-[95%] md:w-[90%] max-w-[750px]"
      >
        {/* Outer Glow Layer */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-pink-400/40 via-purple-500/40 to-cyan-400/40 blur-xl opacity-70" />
        
        {/* Rainbow Border Container */}
        <div className="honor-board-border relative overflow-hidden">
          {/* Mirror Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 pointer-events-none"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Glass Card Inner */}
          <div className="honor-board-inner relative p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-4 pb-3 border-b border-gradient-to-r from-pink-300/30 via-purple-300/30 to-cyan-300/30">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-6 h-6 lg:w-7 lg:h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
              </motion.div>
              
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                ✨ HONOR BOARD ✨
              </h2>
              
              <motion.div
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Crown className="w-6 h-6 lg:w-7 lg:h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
              </motion.div>
            </div>

            {/* Stats Grid - 5 columns desktop, 3 tablet, 2 mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
              {statItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="group relative flex flex-col items-center justify-center gap-1 px-3 py-3 lg:py-4 rounded-xl bg-gradient-to-br from-pink-400/10 via-purple-500/10 to-cyan-400/10 border border-white/40 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,231,255,0.5)] transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        {/* Item Shimmer on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        
                        {/* Icon with Glow */}
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                          className="relative p-2 rounded-lg bg-gradient-to-br from-pink-400/20 via-purple-500/20 to-cyan-400/20"
                        >
                          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-[hsl(var(--cosmic-cyan))] drop-shadow-[0_0_6px_rgba(0,231,255,0.6)]" />
                        </motion.div>
                        
                        {/* Label */}
                        <span className="text-xs lg:text-sm font-medium text-muted-foreground/80 text-center leading-tight">
                          {item.label}
                        </span>
                        
                        {/* Value */}
                        <motion.div
                          animate={{
                            textShadow: [
                              "0 0 4px rgba(0,231,255,0.4)",
                              "0 0 8px rgba(192,132,252,0.5)",
                              "0 0 4px rgba(0,231,255,0.4)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-baseline gap-1"
                        >
                          <span className="text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] bg-clip-text text-transparent tabular-nums">
                            <CounterAnimation value={item.value} decimals={item.isUSD ? 2 : 0} />
                          </span>
                          {item.isCamly && (
                            <span className="text-[10px] lg:text-xs font-semibold text-amber-500">CAMLY</span>
                          )}
                          {item.isUSD && (
                            <span className="text-[10px] lg:text-xs font-semibold text-emerald-500">USD</span>
                          )}
                        </motion.div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/95 backdrop-blur-xl border-[hsl(var(--cosmic-cyan))]/30">
                      <p className="text-sm">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};
