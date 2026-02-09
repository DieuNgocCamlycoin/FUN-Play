import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ======================== TYPES ========================
export type TransactionType = "tip" | "donate" | "reward" | "claim" | "transfer";
export type TransactionStatus = "success" | "pending" | "failed";

export interface UnifiedTransaction {
  id: string;
  source_table: "donation_transactions" | "reward_transactions" | "wallet_transactions";
  
  // Người gửi
  sender_user_id: string | null;
  sender_display_name: string;
  sender_avatar_url: string | null;
  wallet_from: string | null;
  wallet_from_full: string | null;
  
  // Người nhận
  receiver_user_id: string | null;
  receiver_display_name: string;
  receiver_avatar_url: string | null;
  wallet_to: string | null;
  wallet_to_full: string | null;
  
  // Thông tin giao dịch
  token_symbol: string;
  amount: number;
  transaction_type: TransactionType;
  message: string | null;
  
  // Blockchain
  is_onchain: boolean;
  chain: string | null;
  tx_hash: string | null;
  explorer_url: string | null;
  
  // Trạng thái
  status: TransactionStatus;
  created_at: string;
  updated_at: string | null;
}

export interface TransactionFilters {
  search?: string;
  token?: string;
  type?: TransactionType | "all";
  timeRange?: "all" | "7d" | "30d" | "thisMonth" | "custom";
  startDate?: Date;
  endDate?: Date;
  isOnchain?: boolean | "all";
  status?: TransactionStatus | "all";
  userId?: string; // Chỉ lấy giao dịch của user này
}

export interface TransactionStats {
  totalCount: number;
  totalValue: number;
  todayCount: number;
  successCount: number;
  pendingCount: number;
}

interface UseTransactionHistoryOptions {
  publicMode?: boolean; // true = trang công khai, false = ví cá nhân
  limit?: number;
  filters?: TransactionFilters;
}

// ======================== HELPER FUNCTIONS ========================
const formatAddress = (address: string | null): string => {
  if (!address) return "";
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getExplorerUrl = (chain: string | null, txHash: string | null): string | null => {
  if (!txHash) return null;
  switch (chain?.toLowerCase()) {
    case "bsc":
      return `https://bscscan.com/tx/${txHash}`;
    case "eth":
      return `https://etherscan.io/tx/${txHash}`;
    case "btc":
      return `https://blockstream.info/tx/${txHash}`;
    default:
      return `https://bscscan.com/tx/${txHash}`;
  }
};

const getAddressExplorerUrl = (chain: string | null, address: string | null): string | null => {
  if (!address) return null;
  switch (chain?.toLowerCase()) {
    case "bsc":
      return `https://bscscan.com/address/${address}`;
    case "eth":
      return `https://etherscan.io/address/${address}`;
    default:
      return `https://bscscan.com/address/${address}`;
  }
};

// ======================== MAIN HOOK ========================
export function useTransactionHistory(options: UseTransactionHistoryOptions = {}) {
  const { publicMode = false, limit = 50, filters = {} } = options;
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TransactionStats>({
    totalCount: 0,
    totalValue: 0,
    todayCount: 0,
    successCount: 0,
    pendingCount: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchTransactions = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      const allTransactions: UnifiedTransaction[] = reset ? [] : [...transactions];
      
      // ========== 1. Lấy donation_transactions (công khai) ==========
      let donationQuery = supabase
        .from("donation_transactions")
        .select("*")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      // Nếu không phải public mode, chỉ lấy giao dịch của user hiện tại
      if (!publicMode && user?.id) {
        donationQuery = supabase
          .from("donation_transactions")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);
      }
      
      const { data: donations, error: donationError } = await donationQuery;
      
      if (donationError) throw donationError;

      // ========== 2. Lấy reward_transactions (chỉ của user) ==========
      let rewardData: any[] = [];
      if (!publicMode && user?.id) {
        const { data: rewards, error: rewardError } = await supabase
          .from("reward_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);
        
        if (rewardError) throw rewardError;
        rewardData = rewards || [];
      }

      // ========== 3. Lấy wallet_transactions (chỉ của user) ==========
      let walletData: any[] = [];
      if (!publicMode && user?.id) {
        const { data: wallets, error: walletError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);
        
        if (walletError) throw walletError;
        walletData = wallets || [];
      }

      // ========== 4. Thu thập user IDs và token IDs ==========
      const userIds = new Set<string>();
      const tokenIds = new Set<string>();

      donations?.forEach(d => {
        if (d.sender_id) userIds.add(d.sender_id);
        if (d.receiver_id) userIds.add(d.receiver_id);
        if (d.token_id) tokenIds.add(d.token_id);
      });

      rewardData.forEach(r => {
        if (r.user_id) userIds.add(r.user_id);
      });

      walletData.forEach(w => {
        if (w.from_user_id) userIds.add(w.from_user_id);
        if (w.to_user_id) userIds.add(w.to_user_id);
      });

      // ========== 5. Fetch profiles và tokens ==========
      const [profilesRes, tokensRes] = await Promise.all([
        userIds.size > 0
          ? supabase.from("profiles").select("id, username, display_name, avatar_url, wallet_address").in("id", Array.from(userIds))
          : Promise.resolve({ data: [] }),
        tokenIds.size > 0
          ? supabase.from("donate_tokens").select("id, symbol, chain").in("id", Array.from(tokenIds))
          : Promise.resolve({ data: [] }),
      ]);

      // Build lookup maps
      const profilesMap: Record<string, any> = {};
      (profilesRes.data || []).forEach(p => { profilesMap[p.id] = p; });

      const tokensMap: Record<string, any> = {};
      (tokensRes.data || []).forEach(t => { tokensMap[t.id] = t; });

      // ========== 6. Normalize donation_transactions ==========
      donations?.forEach(d => {
        const senderProfile = profilesMap[d.sender_id];
        const receiverProfile = profilesMap[d.receiver_id];
        const token = tokensMap[d.token_id];
        
        allTransactions.push({
          id: d.id,
          source_table: "donation_transactions",
          
          sender_user_id: d.sender_id,
          sender_display_name: senderProfile?.display_name || senderProfile?.username || "Ẩn danh",
          sender_avatar_url: senderProfile?.avatar_url,
          wallet_from: formatAddress(senderProfile?.wallet_address),
          wallet_from_full: senderProfile?.wallet_address,
          
          receiver_user_id: d.receiver_id,
          receiver_display_name: receiverProfile?.display_name || receiverProfile?.username || "Ẩn danh",
          receiver_avatar_url: receiverProfile?.avatar_url,
          wallet_to: formatAddress(receiverProfile?.wallet_address),
          wallet_to_full: receiverProfile?.wallet_address,
          
          token_symbol: token?.symbol || "CAMLY",
          amount: d.amount,
          transaction_type: d.context_type === "tip" ? "tip" : "donate",
          message: d.message,
          
          is_onchain: !!d.tx_hash,
          chain: d.chain || token?.chain || "BSC",
          tx_hash: d.tx_hash,
          explorer_url: getExplorerUrl(d.chain || token?.chain, d.tx_hash),
          
          status: d.status as TransactionStatus,
          created_at: d.created_at,
          updated_at: null,
        });
      });

      // ========== 7. Normalize reward_transactions ==========
      rewardData.forEach(r => {
        const userProfile = profilesMap[r.user_id];
        
        allTransactions.push({
          id: r.id,
          source_table: "reward_transactions",
          
          sender_user_id: null,
          sender_display_name: "Hệ thống FUN PLAY",
          sender_avatar_url: "/images/fun-play-wallet-icon.png",
          wallet_from: null,
          wallet_from_full: null,
          
          receiver_user_id: r.user_id,
          receiver_display_name: userProfile?.display_name || userProfile?.username || "Người dùng",
          receiver_avatar_url: userProfile?.avatar_url,
          wallet_to: formatAddress(userProfile?.wallet_address),
          wallet_to_full: userProfile?.wallet_address,
          
          token_symbol: "CAMLY",
          amount: r.amount,
          transaction_type: "reward",
          message: `Thưởng ${r.reward_type || "hoạt động"}`,
          
          is_onchain: !!r.claim_tx_hash,
          chain: "BSC",
          tx_hash: r.claim_tx_hash || r.tx_hash,
          explorer_url: getExplorerUrl("BSC", r.claim_tx_hash || r.tx_hash),
          
          status: r.status as TransactionStatus,
          created_at: r.created_at,
          updated_at: null,
        });
      });

      // ========== 8. Normalize wallet_transactions ==========
      walletData.forEach(w => {
        const fromProfile = profilesMap[w.from_user_id];
        const toProfile = profilesMap[w.to_user_id];
        
        allTransactions.push({
          id: w.id,
          source_table: "wallet_transactions",
          
          sender_user_id: w.from_user_id,
          sender_display_name: fromProfile?.display_name || fromProfile?.username || "Ẩn danh",
          sender_avatar_url: fromProfile?.avatar_url,
          wallet_from: formatAddress(w.from_address),
          wallet_from_full: w.from_address,
          
          receiver_user_id: w.to_user_id,
          receiver_display_name: toProfile?.display_name || toProfile?.username || "Ẩn danh",
          receiver_avatar_url: toProfile?.avatar_url,
          wallet_to: formatAddress(w.to_address),
          wallet_to_full: w.to_address,
          
          token_symbol: w.token_type || "CAMLY",
          amount: w.amount,
          transaction_type: "transfer",
          message: null,
          
          is_onchain: !!w.tx_hash,
          chain: "BSC",
          tx_hash: w.tx_hash,
          explorer_url: getExplorerUrl("BSC", w.tx_hash),
          
          status: w.status as TransactionStatus,
          created_at: w.created_at,
          updated_at: null,
        });
      });

      // ========== 9. Sắp xếp theo thời gian ==========
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // ========== 10. Tính toán stats ==========
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newStats: TransactionStats = {
        totalCount: allTransactions.length,
        totalValue: allTransactions.reduce((sum, t) => sum + t.amount, 0),
        todayCount: allTransactions.filter(t => new Date(t.created_at) >= today).length,
        successCount: allTransactions.filter(t => t.status === "success").length,
        pendingCount: allTransactions.filter(t => t.status === "pending").length,
      };

      setStats(newStats);
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      setHasMore((donations?.length || 0) >= limit);
      if (reset) setOffset(0);
      
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "Lỗi khi tải giao dịch");
    } finally {
      setLoading(false);
    }
  }, [publicMode, user?.id, limit, offset, transactions]);

  // ========== Apply Filters ==========
  useEffect(() => {
    let filtered = [...transactions];

    // Token filter
    if (filters.token && filters.token !== "all") {
      filtered = filtered.filter(t => t.token_symbol === filters.token);
    }

    // Type filter
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter(t => t.transaction_type === filters.type);
    }

    // Time filter
    if (filters.timeRange && filters.timeRange !== "all") {
      const now = new Date();
      let cutoff: Date;
      
      switch (filters.timeRange) {
        case "7d":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "thisMonth":
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "custom":
          if (filters.startDate) cutoff = filters.startDate;
          else cutoff = new Date(0);
          break;
        default:
          cutoff = new Date(0);
      }
      
      filtered = filtered.filter(t => new Date(t.created_at) >= cutoff);
      
      if (filters.timeRange === "custom" && filters.endDate) {
        filtered = filtered.filter(t => new Date(t.created_at) <= filters.endDate!);
      }
    }

    // Onchain filter
    if (filters.isOnchain !== undefined && filters.isOnchain !== "all") {
      filtered = filtered.filter(t => t.is_onchain === filters.isOnchain);
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.sender_display_name.toLowerCase().includes(search) ||
        t.receiver_display_name.toLowerCase().includes(search) ||
        t.wallet_from_full?.toLowerCase().includes(search) ||
        t.wallet_to_full?.toLowerCase().includes(search) ||
        t.tx_hash?.toLowerCase().includes(search) ||
        t.message?.toLowerCase().includes(search)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions(true);
  }, [publicMode, user?.id]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset(prev => prev + limit);
      fetchTransactions(false);
    }
  }, [loading, hasMore, limit, fetchTransactions]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    loading,
    error,
    stats,
    hasMore,
    loadMore,
    refresh,
    formatAddress,
    getExplorerUrl,
    getAddressExplorerUrl,
  };
}
