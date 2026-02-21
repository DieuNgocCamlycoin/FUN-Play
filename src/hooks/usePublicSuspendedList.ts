import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SuspendedUser {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  ban_reason: string | null;
  banned_at: string | null;
  violation_level: number | null;
}

export interface BlacklistedWallet {
  id: string;
  wallet_address: string;
  reason: string | null;
  created_at: string | null;
  is_permanent: boolean | null;
  user_id: string | null;
}

export interface SuspendedEntry {
  user_id: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  ban_reason: string | null;
  banned_at: string | null;
  violation_level: number | null;
  wallets: BlacklistedWallet[];
}

export function usePublicSuspendedList() {
  const bannedUsersQuery = useQuery({
    queryKey: ["public-suspended-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_suspended_list");
      if (error) throw error;
      return (data || []) as SuspendedUser[];
    },
    refetchInterval: 2 * 60 * 1000,
  });

  const blacklistedWalletsQuery = useQuery({
    queryKey: ["public-blacklisted-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blacklisted_wallets")
        .select("id, wallet_address, reason, created_at, is_permanent, user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BlacklistedWallet[];
    },
    refetchInterval: 2 * 60 * 1000,
  });

  const bannedUsers = bannedUsersQuery.data || [];
  const blacklistedWallets = blacklistedWalletsQuery.data || [];

  const mergedEntries = useMemo<SuspendedEntry[]>(() => {
    const walletsByUser = new Map<string, BlacklistedWallet[]>();
    const orphanWallets: BlacklistedWallet[] = [];

    for (const w of blacklistedWallets) {
      if (w.user_id) {
        const existing = walletsByUser.get(w.user_id) || [];
        existing.push(w);
        walletsByUser.set(w.user_id, existing);
      } else {
        orphanWallets.push(w);
      }
    }

    const entries: SuspendedEntry[] = bannedUsers.map((u) => ({
      user_id: u.user_id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      ban_reason: u.ban_reason,
      banned_at: u.banned_at,
      violation_level: u.violation_level,
      wallets: walletsByUser.get(u.user_id) || [],
    }));

    // Append orphan wallets as separate entries
    for (const w of orphanWallets) {
      entries.push({
        user_id: null,
        username: null,
        display_name: null,
        avatar_url: null,
        ban_reason: w.reason,
        banned_at: w.created_at,
        violation_level: null,
        wallets: [w],
      });
    }

    return entries;
  }, [bannedUsers, blacklistedWallets]);

  return {
    bannedUsers,
    blacklistedWallets,
    mergedEntries,
    totalCount: bannedUsers.length + blacklistedWallets.length,
    isLoading: bannedUsersQuery.isLoading || blacklistedWalletsQuery.isLoading,
  };
}
