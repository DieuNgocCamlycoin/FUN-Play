import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const cacheRef = useRef<{ data: HonobarStats | null; timestamp: number }>({ data: null, timestamp: 0 });

  const fetchStats = useCallback(async () => {
    const now = Date.now();
    if (cacheRef.current.data && now - cacheRef.current.timestamp < 120_000) {
      if (isMountedRef.current) setStats(cacheRef.current.data);
      if (isMountedRef.current) setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc("get_honobar_stats");

      if (error) {
        console.error("Error fetching Honobar stats:", error);
        return;
      }

      if (isMountedRef.current && data) {
        const parsed = data as unknown as HonobarStats;
        cacheRef.current = { data: parsed, timestamp: Date.now() };
        setStats(parsed);
      }
    } catch (error) {
      console.error("Error fetching Honobar stats:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    // Polling every 2 minutes instead of Realtime
    const interval = setInterval(fetchStats, 120_000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStats]);

  return { stats, loading };
};
