import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "./useDebounce";

export interface TopSponsor {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalDonated: number;
}

export const useTopSponsors = (limit: number = 5) => {
  const [sponsors, setSponsors] = useState<TopSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchSponsors = useCallback(async () => {
    try {
      // Fetch successful wallet transactions grouped by sender
      const { data: transactions, error: txError } = await supabase
        .from("wallet_transactions")
        .select("from_user_id, amount")
        .in("status", ["completed", "success"]);

      if (txError) {
        console.error("Error fetching transactions:", txError);
        if (isMountedRef.current) {
          setSponsors([]);
          setLoading(false);
        }
        return;
      }

      if (!transactions || transactions.length === 0) {
        if (isMountedRef.current) {
          setSponsors([]);
          setLoading(false);
        }
        return;
      }

      // Aggregate donations by user
      const donationMap = new Map<string, number>();
      transactions.forEach((tx) => {
        if (tx.from_user_id) {
          const current = donationMap.get(tx.from_user_id) || 0;
          donationMap.set(tx.from_user_id, current + Number(tx.amount));
        }
      });

      // Sort and get top donors
      const sortedDonors = Array.from(donationMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      if (sortedDonors.length === 0) {
        if (isMountedRef.current) {
          setSponsors([]);
          setLoading(false);
        }
        return;
      }

      // Fetch profile info for top donors
      const userIds = sortedDonors.map(([userId]) => userId);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("banned", false)
        .in("id", userIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
        if (isMountedRef.current) {
          setSponsors([]);
          setLoading(false);
        }
        return;
      }

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const sponsorList: TopSponsor[] = sortedDonors
        .filter(([userId]) => profileMap.has(userId))
        .map(([userId, total]) => {
          const profile = profileMap.get(userId)!;
          return {
            userId,
            username: profile.username || "Anonymous",
            displayName: profile.display_name || profile.username || "Anonymous",
            avatarUrl: profile.avatar_url || null,
            totalDonated: total,
          };
        });

      if (isMountedRef.current) {
        setSponsors(sponsorList);
      }
    } catch (error) {
      console.error("Error in useTopSponsors:", error);
      if (isMountedRef.current) {
        setSponsors([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  // Debounced fetch for realtime updates (500ms)
  const debouncedFetch = useDebouncedCallback(fetchSponsors, 500);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSponsors();

    // Realtime subscription for wallet transactions updates
    const channel = supabase
      .channel("top-sponsors-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_transactions" },
        () => {
          debouncedFetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallet_transactions" },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchSponsors, debouncedFetch]);

  return { sponsors, loading, refetch: fetchSponsors };
};
