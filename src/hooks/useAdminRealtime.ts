import { useEffect, useState, useCallback, useRef } from "react";
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

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchInitialStats();
    }, 1000);
  }, [fetchInitialStats]);

  useEffect(() => {
    fetchInitialStats();

    const channel = supabase
      .channel("admin-realtime-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "reward_transactions" }, debouncedRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "claim_requests" }, debouncedRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, debouncedRefetch)
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchInitialStats, debouncedRefetch]);

  return {
    stats,
    isConnected,
    refetch: fetchInitialStats,
  };
}
