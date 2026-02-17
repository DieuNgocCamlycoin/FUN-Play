import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "./useDebounce";

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
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_camly_rewards")
        .eq("banned", false)
        .order("total_camly_rewards", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching top ranking:", error);
        return;
      }

      if (isMountedRef.current) {
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  // Debounced fetch for realtime updates (500ms)
  const debouncedFetch = useDebouncedCallback(fetchRanking, 500);

  useEffect(() => {
    isMountedRef.current = true;
    fetchRanking();

    // Realtime subscription - only UPDATE events on profiles
    const channel = supabase
      .channel("top-ranking-updates")
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "profiles" 
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchRanking, debouncedFetch]);

  return { users, loading, refetch: fetchRanking };
};
