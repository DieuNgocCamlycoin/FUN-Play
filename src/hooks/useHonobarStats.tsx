import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "./useDebounce";

export interface HonobarStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewards: number;
  totalSubscriptions: number;
  camlyPool: number;
  totalPosts: number;
  totalPhotos: number;
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
    totalPosts: 0,
    totalPhotos: 0,
  });
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all stats in parallel
      const [
        { count: usersCount },
        { count: videosCount },
        { data: viewsData },
        { count: commentsCount },
        { data: profilesData },
        { count: subscriptionsCount },
        { count: postsCount },
        { count: photosCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
        supabase.from("videos").select("view_count").eq("approval_status", "approved"),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("total_camly_rewards, approved_reward"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("category", "photo"),
      ]);

      // Calculate total views
      const totalViews = viewsData?.reduce((sum, video) => sum + (video.view_count || 0), 0) || 0;

      // Calculate total rewards (sum of all users' total_camly_rewards)
      const totalRewards = profilesData?.reduce((sum, profile) => sum + (profile.total_camly_rewards || 0), 0) || 0;

      // Calculate CAMLY Pool (sum of approved_reward waiting to be claimed)
      const camlyPool = profilesData?.reduce((sum, profile) => sum + (profile.approved_reward || 0), 0) || 0;

      if (isMountedRef.current) {
        setStats({
          totalUsers: usersCount || 0,
          totalVideos: videosCount || 0,
          totalViews,
          totalComments: commentsCount || 0,
          totalRewards,
          totalSubscriptions: subscriptionsCount || 0,
          camlyPool,
          totalPosts: postsCount || 0,
          totalPhotos: photosCount || 0,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching Honobar stats:", error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced fetch for realtime updates (500ms)
  const debouncedFetch = useDebouncedCallback(fetchStats, 500);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    // CONSOLIDATED: Single channel for all table subscriptions
    const channel = supabase
      .channel("honobar-stats-unified")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, debouncedFetch)
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchStats, debouncedFetch]);

  return { stats, loading };
};
