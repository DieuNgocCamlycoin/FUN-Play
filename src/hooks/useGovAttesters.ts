import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GOV_GROUPS, type GovGroupName } from "@/lib/fun-money/gov-config";

export interface GovAttesterRow {
  id: string;
  gov_group: GovGroupName;
  name: string;
  wallet_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGovAttesters() {
  const [attesters, setAttesters] = useState<GovAttesterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttesters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gov_attesters")
      .select("*")
      .order("gov_group")
      .order("created_at");

    if (error || !data || data.length === 0) {
      const fallback: GovAttesterRow[] = Object.values(GOV_GROUPS).flatMap((g) =>
        g.members.map((m, i) => ({
          id: `fallback-${g.id}-${i}`,
          gov_group: g.id,
          name: m.name,
          wallet_address: m.address,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
      setAttesters(fallback);
    } else {
      setAttesters(data as GovAttesterRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttesters();
  }, []);

  const grouped = {
    will: attesters.filter((a) => a.gov_group === "will"),
    wisdom: attesters.filter((a) => a.gov_group === "wisdom"),
    love: attesters.filter((a) => a.gov_group === "love"),
  };

  return { attesters, grouped, loading, refetch: fetchAttesters };
}
