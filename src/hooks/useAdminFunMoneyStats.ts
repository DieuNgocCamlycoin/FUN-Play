import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActionBreakdown {
  action: string;
  action_count: number;
  total_fun: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  total_fun: number;
}

interface TopHolder {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_fun: number;
  request_count: number;
  action_types: string[];
}

interface DailyMint {
  date: string;
  request_count: number;
  total_fun: number;
}

export interface FunMoneySystemStats {
  totalMinted: number;
  totalPotential: number;
  userCount: number;
  requestCount: number;
  actionBreakdown: ActionBreakdown[];
  statusBreakdown: StatusBreakdown[];
  topHolders: TopHolder[];
  dailyMints: DailyMint[];
}

export const useAdminFunMoneyStats = () => {
  const [stats, setStats] = useState<FunMoneySystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_fun_money_system_stats");
      if (error) {
        console.error("Error fetching FUN Money stats:", error);
        return;
      }
      if (data) {
        const d = data as unknown as FunMoneySystemStats;
        setStats(d);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};
