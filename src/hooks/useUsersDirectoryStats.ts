import { useState, useEffect } from "react";
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

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { data, loading, error, refetch: fetchStats };
}
