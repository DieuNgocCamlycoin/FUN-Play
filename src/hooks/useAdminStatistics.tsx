import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewardsDistributed: number;
  activeUsersToday: number;
}

interface TopCreator {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalViews: number;
  totalRewards: number;
}

interface TopEarner {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalEarned: number;
}

interface DailyStats {
  date: string;
  activeUsers: number;
  rewardsDistributed: number;
}

export const useAdminStatistics = () => {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

      if (error) {
        console.error("Error fetching admin stats:", error);
        return;
      }

      if (data) {
        const result = data as unknown as {
          platformStats: PlatformStats;
          topEarners: TopEarner[];
          topCreators: TopCreator[];
          dailyStats: DailyStats[];
        };
        setPlatformStats(result.platformStats);
        setTopEarners(result.topEarners || []);
        setTopCreators(result.topCreators || []);
        setDailyStats(result.dailyStats || []);
      }
    } catch (error) {
      console.error("Error fetching admin statistics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  return { platformStats, topCreators, topEarners, dailyStats, loading, refetch: fetchAdminStats };
};
