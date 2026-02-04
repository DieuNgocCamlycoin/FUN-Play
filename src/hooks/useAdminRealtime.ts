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
      // Fetch pending rewards count
      const { count: pendingCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("pending_rewards", 0);

      // Fetch recent claims (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: claimsCount } = await supabase
        .from("claim_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString());

      // Fetch active users today
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
    } catch (error) {
      console.error("Error fetching initial stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialStats();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("admin-realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reward_transactions",
        },
        () => {
          // Refetch stats when reward transactions change
          fetchInitialStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "claim_requests",
        },
        () => {
          // Refetch stats when claims change
          fetchInitialStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          // Update pending count if pending_rewards changed
          if (payload.eventType === "UPDATE") {
            fetchInitialStats();
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialStats]);

  return {
    stats,
    isConnected,
    refetch: fetchInitialStats,
  };
}
