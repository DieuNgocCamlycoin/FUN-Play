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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: result, error: err } = await supabase.rpc("get_public_users_directory" as any);
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      const mapped = ((result as any[]) || []).map((r: any): PublicUserStat => ({
        user_id: r.id,
        username: r.username,
        display_name: r.display_name,
        avatar_url: r.avatar_url,
        avatar_verified: r.avatar_verified,
        created_at: r.created_at,
        total_camly_rewards: Number(r.total_camly) || 0,
        claimed_camly: Number(r.claimed_camly) || 0,
        unclaimed_camly: Number(r.available_camly) || 0,
        view_rewards: Number(r.view_rewards) || 0,
        like_rewards: Number(r.like_rewards) || 0,
        comment_rewards: Number(r.comment_rewards) || 0,
        share_rewards: Number(r.share_rewards) || 0,
        upload_rewards: Number(r.upload_rewards) || 0,
        signup_rewards: Number(r.signup_rewards) || 0,
        bounty_rewards: Number(r.bounty_rewards) || 0,
        manual_rewards: Number(r.manual_rewards) || 0,
        posts_count: Number(r.posts_count) || 0,
        videos_count: Number(r.videos_count) || 0,
        comments_count: Number(r.comments_count) || 0,
        views_count: Number(r.total_views) || 0,
        likes_count: Number(r.likes_count) || 0,
        shares_count: Number(r.shares_count) || 0,
        donations_sent_count: Number(r.sent_count) || 0,
        donations_sent_total: Number(r.sent_total) || 0,
        donations_received_count: Number(r.recv_count) || 0,
        donations_received_total: Number(r.recv_total) || 0,
        mint_requests_count: Number(r.mint_count) || 0,
        minted_fun_total: Number(r.minted_total) || 0,
      }));
      setData(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // Polling every 2 minutes instead of Realtime
    const interval = setInterval(fetchData, 120_000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
