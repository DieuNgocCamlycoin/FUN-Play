import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CreatorStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalEarnedAsCreator: number;
  videosThisMonth: number;
  viewsThisMonth: number;
}

export const useCreatorRewards = (userId: string | undefined) => {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCreatorStats = async () => {
      try {
        // Get all videos by this creator
        const { data: videos, error: videosError } = await supabase
          .from("videos")
          .select("id, view_count, like_count, comment_count, created_at")
          .eq("user_id", userId);

        if (videosError) throw videosError;

        const totalVideos = videos?.length || 0;
        const totalViews = videos?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;
        const totalLikes = videos?.reduce((sum, v) => sum + (v.like_count || 0), 0) || 0;
        const totalComments = videos?.reduce((sum, v) => sum + (v.comment_count || 0), 0) || 0;

        // Get UPLOAD rewards earned
        const { data: uploadRewards } = await supabase
          .from("reward_transactions")
          .select("amount")
          .eq("user_id", userId)
          .eq("reward_type", "UPLOAD");

        const totalEarnedAsCreator = uploadRewards?.reduce(
          (sum, r) => sum + Number(r.amount),
          0
        ) || 0;

        // Get this month's stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const videosThisMonth = videos?.filter(
          (v) => new Date(v.created_at) >= startOfMonth
        ).length || 0;

        const viewsThisMonth = videos
          ?.filter((v) => new Date(v.created_at) >= startOfMonth)
          .reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

        setStats({
          totalVideos,
          totalViews,
          totalLikes,
          totalComments,
          totalEarnedAsCreator,
          videosThisMonth,
          viewsThisMonth,
        });
      } catch (error) {
        console.error("Error fetching creator stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorStats();
  }, [userId]);

  return { stats, loading };
};
