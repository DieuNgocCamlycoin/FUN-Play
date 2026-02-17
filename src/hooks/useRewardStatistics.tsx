import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RewardBreakdown {
  type: string;
  total: number;
  count: number;
}

interface DailyReward {
  date: string;
  amount: number;
}

interface UserStatistics {
  totalEarned: number;
  breakdown: RewardBreakdown[];
  dailyRewards: DailyReward[];
  todayLimits: {
    viewRewardsEarned: number;
    commentRewardsEarned: number;
    uploadCount: number;
  };
}

export const useRewardStatistics = (userId: string | undefined) => {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStatistics = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Use RPC for accurate totals + only fetch today's limits
        const [summaryRes, limitsRes] = await Promise.all([
          supabase.rpc('get_user_activity_summary', { p_user_id: userId }),
          supabase
            .from("daily_reward_limits")
            .select("view_rewards_earned, comment_rewards_earned, uploads_count")
            .eq("user_id", userId)
            .eq("date", today)
            .maybeSingle(),
        ]);

        const s = (summaryRes.data || {}) as Record<string, unknown>;
        const typeAmounts = (s.type_amounts || {}) as Record<string, number>;

        // Build breakdown from RPC type_amounts
        const breakdown: RewardBreakdown[] = Object.entries(typeAmounts)
          .filter(([, v]) => Number(v) > 0)
          .map(([type, total]) => ({ type, total: Number(total), count: 0 }));

        setStatistics({
          totalEarned: Number(s.total_camly) || 0,
          breakdown,
          dailyRewards: [], // Not needed - RewardHistory uses its own RPC
          todayLimits: {
            viewRewardsEarned: Number(limitsRes.data?.view_rewards_earned) || 0,
            commentRewardsEarned: Number(limitsRes.data?.comment_rewards_earned) || 0,
            uploadCount: Number(limitsRes.data?.uploads_count) || 0,
          },
        });
      } catch (error) {
        console.error("Error fetching reward statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [userId]);

  return { statistics, loading };
};

export const useRewardHistory = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const { data } = await supabase
          .from("reward_transactions")
          .select(`
            *,
            videos (title)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100);

        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching reward history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  return { transactions, loading };
};
