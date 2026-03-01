import { useState, useEffect, useCallback } from "react";
import { useAdminFunMoneyStats } from "./useAdminFunMoneyStats";
import { useTransparencyStats } from "./useTransparencyStats";
import { supabase } from "@/integrations/supabase/client";

export interface EpochInfo {
  epoch_id: string;
  period_start: string;
  period_end: string;
  status: string;
  mint_pool_amount: number;
  rules_version: string;
  total_light: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewardsDistributed: number;
  activeUsersToday: number;
}

export function useSystemReport() {
  const funMoney = useAdminFunMoneyStats();
  const transparency = useTransparencyStats();
  const [epoch, setEpoch] = useState<EpochInfo | null>(null);
  const [platform, setPlatform] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExtra = useCallback(async () => {
    try {
      const [epochRes, platformRes] = await Promise.all([
        supabase.functions.invoke("pplp-light-api", { body: { action: "epoch" } }),
        supabase.rpc("get_admin_dashboard_stats"),
      ]);
      if (epochRes.data) setEpoch(epochRes.data as EpochInfo);
      if (platformRes.data) {
        const d = platformRes.data as any;
        setPlatform(d.platformStats as PlatformStats);
      }
    } catch (err) {
      console.error("System report fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExtra(); }, [fetchExtra]);

  const refetch = useCallback(() => {
    funMoney.refetch();
    transparency.refetch();
    fetchExtra();
  }, [funMoney, transparency, fetchExtra]);

  return {
    funMoney: funMoney.stats,
    transparency: transparency.data,
    epoch,
    platform,
    loading: loading || funMoney.loading || transparency.loading,
    refetch,
  };
}
