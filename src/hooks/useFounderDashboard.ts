import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatistics } from "./useAdminStatistics";
import { useAdminFunMoneyStats } from "./useAdminFunMoneyStats";
import { useTransparencyStats } from "./useTransparencyStats";

interface TopUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_light_score: number;
  light_level: string | null;
  trust_level: number;
}

interface StreakLeader {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  consistency_days: number;
  light_level: string | null;
}

interface TrustBucket {
  trust_level: number;
  count: number;
}

interface PillarAverages {
  transparent_truth: number;
  unity_over_separation: number;
  long_term_value: number;
  serving_life: number;
  healing_love: number;
}

interface EventStats {
  total_events: number;
  total_attendance: number;
  confirmed_attendance: number;
  avg_participation_factor: number;
}

export interface FounderStats {
  pillar_averages: PillarAverages;
  trust_distribution: TrustBucket[];
  event_stats: EventStats;
  flagged_user_count: number;
  top_light_users: TopUser[];
  streak_leaders: StreakLeader[];
}

export const useFounderDashboard = () => {
  const [founderStats, setFounderStats] = useState<FounderStats | null>(null);
  const [founderLoading, setFounderLoading] = useState(true);

  const adminStats = useAdminStatistics();
  const funMoneyStats = useAdminFunMoneyStats();
  const transparencyStats = useTransparencyStats();

  const fetchFounderStats = useCallback(async () => {
    setFounderLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_founder_dashboard_stats");
      if (error) {
        console.error("Error fetching founder stats:", error);
        return;
      }
      if (data) {
        setFounderStats(data as unknown as FounderStats);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setFounderLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFounderStats();
  }, [fetchFounderStats]);

  const loading = founderLoading || adminStats.loading || funMoneyStats.loading || transparencyStats.loading;

  return {
    founderStats,
    adminStats,
    funMoneyStats,
    transparencyStats,
    loading,
    refetch: fetchFounderStats,
  };
};
