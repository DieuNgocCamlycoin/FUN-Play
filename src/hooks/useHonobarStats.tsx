import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HonobarStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewards: number;
  totalSubscriptions: number;
  camlyPool: number;
  topCreator: {
    displayName: string;
    videoCount: number;
  } | null;
}

export const useHonobarStats = () => {
  const [stats, setStats] = useState<HonobarStats>({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalComments: 0,
    totalRewards: 0,
    totalSubscriptions: 0,
    camlyPool: 0,
    topCreator: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        { count: usersCount },
        { count: videosCount },
        { data: viewsData },
        { count: commentsCount },
        { data: profilesData },
        { count: subscriptionsCount },
        { data: topCreatorData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
        supabase.from("videos").select("view_count"),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("total_camly_rewards, approved_reward"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }),
        supabase.from("videos")
          .select("user_id, profiles!inner(display_name, username)")
          .eq("approval_status", "approved")
          .limit(1000),
      ]);

      // Calculate total views
      const totalViews = viewsData?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0;

      // Calculate total rewards (sum of all users' total_camly_rewards)
      const totalRewards = profilesData?.reduce((sum, profile) => sum + (profile.total_camly_rewards || 0), 0) || 0;

      // Calculate CAMLY Pool (sum of approved_reward waiting to be claimed)
      const camlyPool = profilesData?.reduce((sum, profile) => sum + (profile.approved_reward || 0), 0) || 0;

      // Find top creator (user with most approved videos)
      let topCreator: { displayName: string; videoCount: number } | null = null;
      if (topCreatorData && topCreatorData.length > 0) {
        const creatorCounts: Record<string, { displayName: string; count: number }> = {};
        topCreatorData.forEach((video: any) => {
          const userId = video.user_id;
          const profile = video.profiles;
          if (!creatorCounts[userId]) {
            creatorCounts[userId] = {
              displayName: profile?.display_name || profile?.username || "Unknown",
              count: 0,
            };
          }
          creatorCounts[userId].count++;
        });
        
        const sortedCreators = Object.values(creatorCounts).sort((a, b) => b.count - a.count);
        if (sortedCreators.length > 0) {
          topCreator = {
            displayName: sortedCreators[0].displayName,
            videoCount: sortedCreators[0].count,
          };
        }
      }

      setStats({
        totalUsers: usersCount || 0,
        totalVideos: videosCount || 0,
        totalViews,
        totalComments: commentsCount || 0,
        totalRewards,
        totalSubscriptions: subscriptionsCount || 0,
        camlyPool,
        topCreator,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Honobar stats:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up realtime subscriptions for all tables
    const profilesChannel = supabase
      .channel("honobar-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchStats)
      .subscribe();

    const videosChannel = supabase
      .channel("honobar-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, fetchStats)
      .subscribe();

    const commentsChannel = supabase
      .channel("honobar-comments")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, fetchStats)
      .subscribe();

    const transactionsChannel = supabase
      .channel("honobar-transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions" }, fetchStats)
      .subscribe();

    const subscriptionsChannel = supabase
      .channel("honobar-subscriptions")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, []);

  return { stats, loading };
};
