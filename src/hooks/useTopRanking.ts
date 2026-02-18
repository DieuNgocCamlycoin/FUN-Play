import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_camly_rewards: number;
}

export const useTopRanking = (limit: number = 5) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchRanking = useCallback(async () => {
    try {
      // Query from Materialized View (pre-computed, refreshed every 10 min)
      const { data, error } = await (supabase
        .from("mv_top_ranking" as any)
        .select("id, username, display_name, avatar_url, total_camly_rewards")
        .order("total_camly_rewards", { ascending: false })
        .limit(limit) as any);

      if (error) {
        console.error("Error fetching top ranking:", error);
        return;
      }

      if (isMountedRef.current) {
        setUsers((data as LeaderboardUser[]) || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRanking();

    // Polling every 2 minutes instead of Realtime
    const interval = setInterval(fetchRanking, 120_000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRanking]);

  return { users, loading, refetch: fetchRanking };
};
