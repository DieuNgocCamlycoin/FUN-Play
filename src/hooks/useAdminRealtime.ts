import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeStats {
  pendingRewardsCount: number;
  recentClaimsCount: number;
  activeUsersToday: number;
}

export function useAdminRealtime() {
  const [stats, setStats] = useState<RealtimeStats>({
    pendingRewardsCount: 0,
    recentClaimsCount: 0,
    activeUsersToday: 0,
  });
  const [isConnected, setIsConnected] = useState(false);

  const fetchInitialStats = useCallback(async () => {
    try {
      const { count: pendingCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("pending_rewards", 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: claimsCount } = await supabase
        .from("claim_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString());

      const today = new Date().toISOString().split("T")[0];
      const { count: activeCount } = await supabase
        .from("daily_reward_limits")
        .select("*", { count: "exact", head: true })
        .eq("date", today);

      setStats({
        pendingRewardsCount: pendingCount || 0,
        recentClaimsCount: claimsCount || 0,
        activeUsersToday: activeCount || 0,
      });
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching initial stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialStats();
  }, [fetchInitialStats]);

  return {
    stats,
    isConnected,
    refetch: fetchInitialStats,
  };
}
