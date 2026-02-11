import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserDirectoryStat {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
  banned: boolean;
  avatar_verified: boolean;
  pending_rewards: number;
  approved_reward: number;
  total_camly_rewards: number;
  posts_count: number;
  videos_count: number;
  comments_count: number;
  views_count: number;
  likes_count: number;
  shares_count: number;
  donations_sent_count: number;
  donations_sent_total: number;
  donations_received_count: number;
  donations_received_total: number;
  mint_requests_count: number;
  minted_fun_total: number;
}

export function useUsersDirectoryStats() {
  const [data, setData] = useState<UserDirectoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: result, error: err } = await supabase.rpc("get_users_directory_stats");
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((result as unknown as UserDirectoryStat[]) || []);
    }
    setLoading(false);
  }, []);

  const debouncedRefetch = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchStats();
    }, 2000);
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-users-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_transactions' }, debouncedRefetch)
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedRefetch]);

  return { data, loading, error, refetch: fetchStats };
}
