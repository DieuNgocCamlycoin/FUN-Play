import { useQuery } from "@tanstack/react-query";
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
        .select("id, wallet_address, reason, created_at, is_permanent")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BlacklistedWallet[];
    },
    refetchInterval: 2 * 60 * 1000,
  });

  return {
    bannedUsers: bannedUsersQuery.data || [],
    blacklistedWallets: blacklistedWalletsQuery.data || [],
    isLoading: bannedUsersQuery.isLoading || blacklistedWalletsQuery.isLoading,
  };
}
