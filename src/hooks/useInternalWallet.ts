import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InternalBalance {
  tokenId: string;
  tokenSymbol: string;
  tokenName: string;
  tokenIcon: string | null;
  balance: number;
}

export const useInternalWallet = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<InternalBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    if (!user) {
      setBalances([]);
      setLoading(false);
      return;
    }

    try {
      // Get all internal tokens (if any remain)
      const { data: tokens } = await supabase
        .from("donate_tokens")
        .select("id, symbol, name, icon_url")
        .eq("chain", "internal")
        .eq("is_enabled", true);

      if (!tokens || tokens.length === 0) {
        setBalances([]);
        setLoading(false);
        return;
      }

      // Get user's internal wallet balances
      const { data: wallets } = await supabase
        .from("internal_wallets")
        .select("token_id, balance")
        .eq("user_id", user.id);

      const walletMap = new Map(wallets?.map((w) => [w.token_id, w.balance]) || []);

      const balanceList: InternalBalance[] = tokens.map((token) => ({
        tokenId: token.id,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        tokenIcon: token.icon_url,
        balance: walletMap.get(token.id) || 0,
      }));

      setBalances(balanceList);
    } catch (error) {
      console.error("Error fetching internal wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBalanceBySymbol = (symbol: string): number => {
    const balance = balances.find((b) => b.tokenSymbol === symbol);
    return balance?.balance || 0;
  };

  useEffect(() => {
    fetchBalances();

    if (!user) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel("internal-wallet-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBalances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    balances,
    loading,
    refetch: fetchBalances,
    getBalanceBySymbol,
  };
};
