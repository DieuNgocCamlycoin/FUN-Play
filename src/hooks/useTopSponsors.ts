import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        // Fetch successful wallet transactions grouped by sender
        const { data: transactions, error: txError } = await supabase
          .from("wallet_transactions")
          .select("from_user_id, amount")
          .in("status", ["completed", "success"]);

        if (txError) {
          console.error("Error fetching transactions:", txError);
          setSponsors([]);
          setLoading(false);
          return;
        }

        if (!transactions || transactions.length === 0) {
          setSponsors([]);
          setLoading(false);
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
          setSponsors([]);
          setLoading(false);
          return;
        }

        // Fetch profile info for top donors
        const userIds = sortedDonors.map(([userId]) => userId);
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
          setSponsors([]);
          setLoading(false);
          return;
        }

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        const sponsorList: TopSponsor[] = sortedDonors.map(([userId, total]) => {
          const profile = profileMap.get(userId);
          return {
            userId,
            username: profile?.username || "Anonymous",
            displayName: profile?.display_name || profile?.username || "Anonymous",
            avatarUrl: profile?.avatar_url || null,
            totalDonated: total,
          };
        });

        setSponsors(sponsorList);
      } catch (error) {
        console.error("Error in useTopSponsors:", error);
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();

    // Realtime subscription for wallet transactions updates
    const channel = supabase
      .channel("top-sponsors-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_transactions" },
        () => {
          fetchSponsors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { sponsors, loading };
};
