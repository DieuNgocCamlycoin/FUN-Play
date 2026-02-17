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
        // Single optimized query: fetch profile + transactions + today limits in parallel
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [profileRes, transactionsRes, limitsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("total_camly_rewards")
            .eq("id", userId)
            .single(),
          supabase
            .from("reward_transactions")
            .select("reward_type, amount, created_at")
            .eq("user_id", userId)
            .gte("created_at", thirtyDaysAgo.toISOString())
            .order("created_at", { ascending: true }),
          supabase
            .from("daily_reward_limits")
            .select("view_rewards_earned, comment_rewards_earned, uploads_count")
            .eq("user_id", userId)
            .eq("date", today)
            .maybeSingle(),
        ]);

        // Calculate breakdown and daily rewards from the single transactions query
        const breakdownMap = new Map<string, { total: number; count: number }>();
        const dailyMap = new Map<string, number>();

        transactionsRes.data?.forEach((tx) => {
          // Breakdown
          const existing = breakdownMap.get(tx.reward_type) || { total: 0, count: 0 };
          breakdownMap.set(tx.reward_type, {
            total: existing.total + Number(tx.amount),
            count: existing.count + 1,
          });
          // Daily
          const date = new Date(tx.created_at).toISOString().split('T')[0];
          dailyMap.set(date, (dailyMap.get(date) || 0) + Number(tx.amount));
        });

        setStatistics({
          totalEarned: Number(profileRes.data?.total_camly_rewards) || 0,
          breakdown: Array.from(breakdownMap.entries()).map(([type, data]) => ({ type, ...data })),
          dailyRewards: Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount })),
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
