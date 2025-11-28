import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HonobarStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewards: number;
  totalSubscriptions: number;
}

export const useHonobarStats = () => {
  const [stats, setStats] = useState<HonobarStats>({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalComments: 0,
    totalRewards: 0,
    totalSubscriptions: 0,
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
        { data: rewardsData },
        { count: subscriptionsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("view_count"),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("wallet_transactions").select("amount, status").eq("status", "success"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }),
      ]);

      // Calculate total views
      const totalViews = viewsData?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0;

      // Calculate total rewards (sum of all successful transactions)
      const totalRewards = rewardsData?.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalVideos: videosCount || 0,
        totalViews,
        totalComments: commentsCount || 0,
        totalRewards,
        totalSubscriptions: subscriptionsCount || 0,
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
