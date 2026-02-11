import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicUserStat {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_verified: boolean;
  created_at: string;
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

export function usePublicUsersDirectory() {
  const [data, setData] = useState<PublicUserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const { data: result, error: err } = await supabase.rpc("get_public_users_directory" as any);
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((result as unknown as PublicUserStat[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
