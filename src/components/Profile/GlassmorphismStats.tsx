import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Eye, MessageSquare, Coins, Sparkles } from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { motion } from "framer-motion";

interface GlassmorphismStatsProps {
  userId: string;
  channelId: string;
}

interface ChannelStats {
  followers: number;
  videos: number;
  totalViews: number;
  comments: number;
  rewardsEarned: number;
}

export const GlassmorphismStats = ({ userId, channelId }: GlassmorphismStatsProps) => {
  const [stats, setStats] = useState<ChannelStats>({
    followers: 0,
    videos: 0,
    totalViews: 0,
    comments: 0,
    rewardsEarned: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch channel for subscriber count
      const { data: channelData } = await supabase
        .from("channels")
        .select("subscriber_count")
        .eq("id", channelId)
        .single();

      // Fetch videos count and total views
      const { data: videosData } = await supabase
        .from("videos")
        .select("id, view_count")
        .eq("channel_id", channelId)
        .eq("is_public", true);

      const videoIds = videosData?.map(v => v.id) || [];
      const totalViews = videosData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

      // Fetch comments on user's videos
      let totalComments = 0;
      if (videoIds.length > 0) {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: 'exact', head: true })
          .in("video_id", videoIds);
        totalComments = count || 0;
      }

      // Fetch total rewards from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_camly_rewards")
        .eq("id", userId)
        .single();

      setStats({
        followers: channelData?.subscriber_count || 0,
        videos: videosData?.length || 0,
        totalViews,
        comments: totalComments,
        rewardsEarned: profileData?.total_camly_rewards || 0,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching channel stats:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId, channelId]);

  // Real-time updates
  useEffect(() => {
    const channelSub = supabase
      .channel(`stats-updates-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `id=eq.${channelId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos', filter: `channel_id=eq.${channelId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [userId, channelId]);

  const statItems = [
    {
      icon: Users,
      label: "Followers",
      value: stats.followers,
      gradient: "from-pink-500 via-rose-500 to-red-500",
      glowColor: "rgba(236,72,153,0.5)",
    },
    {
      icon: Video,
      label: "Videos",
      value: stats.videos,
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      glowColor: "rgba(139,92,246,0.5)",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: stats.totalViews,
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      glowColor: "rgba(6,182,212,0.5)",
    },
    {
      icon: MessageSquare,
      label: "Comments",
      value: stats.comments,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      glowColor: "rgba(245,158,11,0.5)",
    },
    {
      icon: Coins,
      label: "Rewards Earned",
      value: stats.rewardsEarned,
      gradient: "from-yellow-400 via-amber-400 to-orange-400",
      glowColor: "rgba(251,191,36,0.6)",
      suffix: " CAMLY",
      decimals: 0,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-20 rounded-xl bg-white/60 border border-gray-200" />
        ))}
      </div>
    );
  }

  // Compact version - only show 3 key stats
  const compactStats = [
    statItems[4], // Rewards
    statItems[4], // Balance (use same for now)
    { ...statItems[0], label: "Người theo dõi", value: stats.followers }, // Followers
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {/* Total Reward Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center shadow-md">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Tổng Reward</div>
            <div className="text-xl font-bold text-red-500">
              <CounterAnimation value={stats.rewardsEarned} decimals={3} />
              <span className="text-sm ml-1">CAMLY</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center shadow-md">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Số dư CAMLY</div>
            <div className="text-xl font-bold text-green-600">
              <CounterAnimation value={0} decimals={3} />
              <span className="text-sm ml-1">CAMLY</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Followers Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Người theo dõi</div>
            <div className="text-xl font-bold text-blue-600">
              <CounterAnimation value={stats.followers} decimals={3} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
