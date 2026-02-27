import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LightCommunityMember {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  light_level: string | null;
  light_score: number;
}

export const useLightCommunity = (limit: number = 5) => {
  const [members, setMembers] = useState<LightCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const cacheRef = useRef<{ data: LightCommunityMember[]; timestamp: number }>({ data: [], timestamp: 0 });

  const fetchCommunity = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cacheRef.current.data.length > 0 && now - cacheRef.current.timestamp < 120_000) {
      if (isMountedRef.current) { setMembers(cacheRef.current.data); setLoading(false); }
      return;
    }
    try {
      // Fetch users with highest light levels (builder, guardian, architect first)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, light_level, light_score")
        .not("banned", "eq", true)
        .gte("light_score", 20)
        .order("light_score", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching light community:", error);
        return;
      }

      if (isMountedRef.current) {
        const result = (data as LightCommunityMember[]) || [];
        cacheRef.current = { data: result, timestamp: Date.now() };
        setMembers(result);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCommunity();
    const interval = setInterval(fetchCommunity, 120_000);
    return () => { isMountedRef.current = false; clearInterval(interval); };
  }, [fetchCommunity]);

  const forceRefetch = useCallback(() => fetchCommunity(true), [fetchCommunity]);

  return { members, loading, refetch: forceRefetch };
};
