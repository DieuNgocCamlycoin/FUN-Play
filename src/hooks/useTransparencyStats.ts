import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TransparencyStats {
  total_light: number;
  total_users_with_light: number;
  total_fun_minted: number;
  level_distribution_pct: Record<string, number>;
  total_sequences_completed: number;
  active_rule: { rule_version: string; name: string };
}

export function useTransparencyStats() {
  const [data, setData] = useState<TransparencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "pplp-light-api",
        { body: { action: "transparency" } }
      );
      if (fnError) throw fnError;
      setData(result as TransparencyStats);
    } catch (err: any) {
      setError(err.message || "Failed to load transparency stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { data, loading, error, refetch: fetchStats };
}
