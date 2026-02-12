import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicUserStat {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_verified: boolean;
  created_at: string;
  total_camly_rewards: number;
  claimed_camly: number;
  unclaimed_camly: number;
  view_rewards: number;
  like_rewards: number;
  comment_rewards: number;
  share_rewards: number;
  upload_rewards: number;
  signup_rewards: number;
  bounty_rewards: number;
  manual_rewards: number;
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
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
  }, []);

  const debouncedRefetch = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchData();
    }, 2000);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('users-directory-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_transactions' }, debouncedRefetch)
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedRefetch]);

  return { data, loading, error, refetch: fetchData };
}
