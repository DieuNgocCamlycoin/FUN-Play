import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewardsDistributed: number;
  activeUsersToday: number;
}

export interface TopCreator {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalViews: number;
  totalRewards: number;
}

export interface TopEarner {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalEarned: number;
}

interface DailyStats {
  date: string;
  activeUsers: number;
  rewardsDistributed: number;
  views: number;
  comments: number;
}

export const useAdminStatistics = () => {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAdminStats = useCallback(async () => {
      try {
        // Get total users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true });

        // Get total videos
        const { count: videoCount } = await supabase
          .from("videos")
          .select("*", { count: 'exact', head: true });

        // Get total views (sum of all video view_count)
        const { data: videosData } = await supabase
          .from("videos")
          .select("view_count");
        const totalViews = videosData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

        // Get total comments
        const { count: commentCount } = await supabase
          .from("comments")
          .select("*", { count: 'exact', head: true });

        // Get total rewards distributed
        const { data: rewardsData } = await supabase
          .from("reward_transactions")
          .select("amount");
        const totalRewards = rewardsData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        // Get active users today
        const today = new Date().toISOString().split('T')[0];
        const { count: activeToday } = await supabase
          .from("daily_reward_limits")
          .select("*", { count: 'exact', head: true })
          .eq("date", today);

        setPlatformStats({
          totalUsers: userCount || 0,
          totalVideos: videoCount || 0,
          totalViews,
          totalComments: commentCount || 0,
          totalRewardsDistributed: totalRewards,
          activeUsersToday: activeToday || 0,
        });

        // Get top creators (by video count and views)
        const { data: creatorsData } = await supabase
          .from("videos")
          .select(`
            user_id,
            view_count,
            profiles!videos_user_id_fkey (display_name, avatar_url, total_camly_rewards)
          `);

        const creatorMap = new Map<string, TopCreator>();
        creatorsData?.forEach((video: any) => {
          const existing = creatorMap.get(video.user_id) || {
            userId: video.user_id,
            displayName: video.profiles?.display_name || 'Unknown',
            avatarUrl: video.profiles?.avatar_url,
            videoCount: 0,
            totalViews: 0,
            totalRewards: Number(video.profiles?.total_camly_rewards) || 0,
          };
          creatorMap.set(video.user_id, {
            ...existing,
            videoCount: existing.videoCount + 1,
            totalViews: existing.totalViews + (video.view_count || 0),
          });
        });

        const sortedCreators = Array.from(creatorMap.values())
          .sort((a, b) => b.totalViews - a.totalViews)
          .slice(0, 10);
        setTopCreators(sortedCreators);

        // Get top earners
        const { data: earnersData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, total_camly_rewards")
          .order("total_camly_rewards", { ascending: false })
          .limit(10);

        const topEarnersList = earnersData?.map((p) => ({
          userId: p.id,
          displayName: p.display_name || 'Unknown',
          avatarUrl: p.avatar_url,
          totalEarned: Number(p.total_camly_rewards) || 0,
        })) || [];
        setTopEarners(topEarnersList);

        // Get daily stats for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: rewardsDaily } = await supabase
          .from("reward_transactions")
          .select("amount, created_at")
          .gte("created_at", thirtyDaysAgo.toISOString());

        const { data: viewsDaily } = await supabase
          .from("view_logs")
          .select("created_at")
          .gte("created_at", thirtyDaysAgo.toISOString());

        const { data: commentsDaily } = await supabase
          .from("comments")
          .select("created_at")
          .gte("created_at", thirtyDaysAgo.toISOString());

        const { data: activeDaily } = await supabase
          .from("daily_reward_limits")
          .select("date, user_id")
          .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

        // Aggregate daily stats
        const dailyMap = new Map<string, DailyStats>();
        
        // Initialize last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dailyMap.set(dateStr, {
            date: dateStr,
            activeUsers: 0,
            rewardsDistributed: 0,
            views: 0,
            comments: 0,
          });
        }

        rewardsDaily?.forEach((r) => {
          const date = new Date(r.created_at).toISOString().split('T')[0];
          const existing = dailyMap.get(date);
          if (existing) {
            existing.rewardsDistributed += Number(r.amount);
          }
        });

        viewsDaily?.forEach((v) => {
          const date = new Date(v.created_at).toISOString().split('T')[0];
          const existing = dailyMap.get(date);
          if (existing) {
            existing.views += 1;
          }
        });

        commentsDaily?.forEach((c) => {
          const date = new Date(c.created_at).toISOString().split('T')[0];
          const existing = dailyMap.get(date);
          if (existing) {
            existing.comments += 1;
          }
        });

        // Count unique users per day
        const usersByDate = new Map<string, Set<string>>();
        activeDaily?.forEach((a) => {
          const dateStr = a.date;
          if (!usersByDate.has(dateStr)) {
            usersByDate.set(dateStr, new Set());
          }
          usersByDate.get(dateStr)?.add(a.user_id);
        });

        usersByDate.forEach((users, date) => {
          const existing = dailyMap.get(date);
          if (existing) {
            existing.activeUsers = users.size;
          }
        });

        const sortedDaily = Array.from(dailyMap.values())
          .sort((a, b) => a.date.localeCompare(b.date));
        setDailyStats(sortedDaily);

      } catch (error) {
        console.error("Error fetching admin statistics:", error);
      } finally {
        setLoading(false);
      }
  }, []);

  // Debounced fetch for realtime updates
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchAdminStats();
    }, 300);
  }, [fetchAdminStats]);

  useEffect(() => {
    fetchAdminStats();

    // Set up realtime subscriptions for all relevant tables
    const channel = supabase
      .channel('admin-realtime-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_transactions' }, debouncedFetch)
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('[Admin Stats] Realtime status:', status);
      });

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchAdminStats, debouncedFetch]);

  return { platformStats, topCreators, topEarners, dailyStats, loading, isConnected };
};
