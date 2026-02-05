import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TopCreator {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalViews: number;
}

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
    avatarUrl: string | null;
    videoCount: number;
    totalViews: number;
  } | null;
  topCreators: TopCreator[];
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
    topCreators: [],
  });
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    // Debounce to prevent rapid refetches
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
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
          supabase.from("videos").select("view_count").eq("approval_status", "approved"),
          supabase.from("comments").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("total_camly_rewards, approved_reward"),
          supabase.from("subscriptions").select("*", { count: "exact", head: true }),
          supabase.from("videos")
            .select("user_id, view_count, profiles!inner(display_name, username, avatar_url)")
            .eq("approval_status", "approved")
            .limit(1000),
        ]);

        // Calculate total views
        const totalViews = viewsData?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0;

        // Calculate total rewards (sum of all users' total_camly_rewards)
        const totalRewards = profilesData?.reduce((sum, profile) => sum + (profile.total_camly_rewards || 0), 0) || 0;

        // Calculate CAMLY Pool (sum of approved_reward waiting to be claimed)
        const camlyPool = profilesData?.reduce((sum, profile) => sum + (profile.approved_reward || 0), 0) || 0;

        // Build top 10 creators (sorted by total views, matching Admin logic)
        const topCreators: TopCreator[] = [];
        if (topCreatorData && topCreatorData.length > 0) {
          const creatorMap: Record<string, TopCreator> = {};
          
          topCreatorData.forEach((video: any) => {
            const userId = video.user_id;
            const profile = video.profiles;
            
            if (!creatorMap[userId]) {
              creatorMap[userId] = {
                userId,
                displayName: profile?.display_name || profile?.username || "Unknown",
                avatarUrl: profile?.avatar_url || null,
                videoCount: 0,
                totalViews: 0,
              };
            }
            creatorMap[userId].videoCount++;
            creatorMap[userId].totalViews += video.view_count || 0;
          });

          // Sort by totalViews descending, then by videoCount
          const sortedCreators = Object.values(creatorMap)
            .sort((a, b) => {
              if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
              return b.videoCount - a.videoCount;
            })
            .slice(0, 10);

          topCreators.push(...sortedCreators);
        }

        // Top 1 creator for backward compatibility
        const topCreator = topCreators.length > 0 
          ? {
              displayName: topCreators[0].displayName,
              avatarUrl: topCreators[0].avatarUrl,
              videoCount: topCreators[0].videoCount,
              totalViews: topCreators[0].totalViews,
            }
          : null;

        setStats({
          totalUsers: usersCount || 0,
          totalVideos: videosCount || 0,
          totalViews,
          totalComments: commentsCount || 0,
          totalRewards,
          totalSubscriptions: subscriptionsCount || 0,
          camlyPool,
          topCreator,
          topCreators,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Honobar stats:", error);
        setLoading(false);
      }
    }, 300);
  }, []);

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
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [fetchStats]);

  return { stats, loading };
};
