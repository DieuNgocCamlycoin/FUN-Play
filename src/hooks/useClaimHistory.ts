import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClaimRequest {
  id: string;
  amount: number;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface PendingRewardsData {
  pendingRewards: number;
  lastClaimAt: string | null;
  totalEarned: number;
}

export const useClaimHistory = (userId: string | undefined) => {
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("claim_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("Error fetching claim history:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return { claims, loading, refetch: fetchClaims };
};

export const usePendingRewards = (userId: string | undefined) => {
  const [data, setData] = useState<PendingRewardsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPendingRewards = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("approved_reward, last_claim_at, total_camly_rewards")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setData({
        pendingRewards: Number(profile?.approved_reward) || 0,
        lastClaimAt: profile?.last_claim_at || null,
        totalEarned: Number(profile?.total_camly_rewards) || 0,
      });
    } catch (error) {
      console.error("Error fetching pending rewards:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPendingRewards();
  }, [fetchPendingRewards]);

  return { data, loading, refetch: fetchPendingRewards };
};

export const useEstimatedEarnings = (userId: string | undefined) => {
  const [estimate, setEstimate] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchEstimate = async () => {
      try {
        // Get last 7 days of reward transactions
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: transactions, error } = await supabase
          .from("reward_transactions")
          .select("amount, created_at")
          .eq("user_id", userId)
          .gte("created_at", sevenDaysAgo.toISOString());

        if (error) throw error;

        const totalLast7Days = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
        const dailyAverage = totalLast7Days / 7;

        setEstimate({
          daily: Math.round(dailyAverage),
          weekly: Math.round(dailyAverage * 7),
          monthly: Math.round(dailyAverage * 30),
        });
      } catch (error) {
        console.error("Error fetching estimated earnings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [userId]);

  return { estimate, loading };
};
