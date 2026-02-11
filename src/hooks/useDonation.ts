import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendDonation as sendBscDonation } from "@/lib/donation";
import { toast } from "@/hooks/use-toast";

export interface DonationToken {
  id: string;
  symbol: string;
  name: string;
  chain: "internal" | "bsc";
  contract_address: string | null;
  decimals: number;
  is_enabled: boolean;
  priority: number;
  icon_url: string | null;
}

export interface DonationTransaction {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  token_id: string;
  amount: number;
  message: string | null;
  context_type: string;
  context_id: string | null;
  receipt_public_id: string;
  status: string;
  chain: string;
  tx_hash: string | null;
  explorer_url: string | null;
  token?: DonationToken;
  sender?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CreateDonationParams {
  receiverId: string;
  tokenSymbol: string;
  amount: number;
  message?: string;
  contextType?: "global" | "post" | "video" | "comment";
  contextId?: string;
  receiverWalletAddress?: string;
  theme?: string;
  music?: string;
}

export const useDonation = () => {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<DonationToken[]>([]);

  const fetchTokens = useCallback(async () => {
    const { data, error } = await supabase
      .from("donate_tokens")
      .select("*")
      .eq("is_enabled", true)
      .order("priority", { ascending: true });

    if (!error && data) {
      setTokens(data as DonationToken[]);
    }
    return data as DonationToken[] || [];
  }, []);

  const createDonation = async (params: CreateDonationParams): Promise<{
    success: boolean;
    transaction?: DonationTransaction;
    receiptUrl?: string;
    requiresWallet?: boolean;
    error?: string;
  }> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Vui lòng đăng nhập để tặng");
      }

      // Get token info first
      const { data: tokenData } = await supabase
        .from("donate_tokens")
        .select("*")
        .eq("symbol", params.tokenSymbol)
        .eq("is_enabled", true)
        .single();

      if (!tokenData) {
        throw new Error("Token không hợp lệ");
      }

      // For BSC tokens, use on-chain transfer
      if (tokenData.chain === "bsc" && params.receiverWalletAddress) {
        // Create pending transaction first
        const { data, error } = await supabase.functions.invoke("create-donation", {
          body: {
            receiver_id: params.receiverId,
            token_symbol: params.tokenSymbol,
            amount: params.amount,
            message: params.message,
            context_type: params.contextType || "global",
            context_id: params.contextId,
            theme: params.theme,
            music: params.music,
          },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        // Now send BSC transaction
        try {
          const bscResult = await sendBscDonation({
            toAddress: params.receiverWalletAddress,
            amount: params.amount,
            tokenSymbol: params.tokenSymbol,
            tokenAddress: tokenData.contract_address || "native",
            decimals: tokenData.decimals,
            videoId: params.contextType === "video" ? params.contextId : undefined,
          });

          // Confirm the transaction
          if (bscResult.success && bscResult.txHash) {
            const { data: confirmData } = await supabase.functions.invoke("confirm-bsc-donation", {
              body: {
                transaction_id: data.transaction.id,
                tx_hash: bscResult.txHash,
              },
            });

            return {
              success: true,
              transaction: confirmData?.transaction || data.transaction,
              receiptUrl: data.receipt_url,
            };
          }
        } catch (bscError: any) {
          // Mark transaction as failed
          console.error("BSC transaction failed:", bscError);
          const msg = bscError.message || "";
          if (msg.includes("exceeds balance") || msg.includes("insufficient funds")) {
            throw new Error("Số dư token trong ví không đủ để thực hiện giao dịch này. Vui lòng kiểm tra lại số dư ví BSC của bạn.");
          }
          throw new Error(msg || "Giao dịch BSC thất bại");
        }
      }

      // For internal tokens, use edge function
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: {
          receiver_id: params.receiverId,
          token_symbol: params.tokenSymbol,
          amount: params.amount,
          message: params.message,
          context_type: params.contextType || "global",
          context_id: params.contextId,
          theme: params.theme,
          music: params.music,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return {
        success: true,
        transaction: data.transaction,
        receiptUrl: data.receipt_url,
        requiresWallet: data.requires_wallet,
      };
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thực hiện giao dịch",
        variant: "destructive",
      });
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const getReceipt = async (receiptPublicId: string) => {
    const { data, error } = await supabase.functions.invoke("get-donation-receipt", {
      body: {},
      headers: {},
    });

    // Fallback to query params approach
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-donation-receipt?receipt_public_id=${receiptPublicId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );

    const result = await response.json();
    return result.receipt;
  };

  return {
    loading,
    tokens,
    fetchTokens,
    createDonation,
    getReceipt,
  };
};
