import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayInfo, ProfileData, ChannelData } from "@/lib/userUtils";
import { getSystemWalletDisplayInfo } from "@/config/systemWallets";

// ======================== TYPES ========================
// UPDATED: Remove "tip", "reward", "transfer" → Use "gift", "donate", "claim"
export type TransactionType = "gift" | "donate" | "claim";
export type TransactionStatus = "success" | "pending" | "failed";

export interface UnifiedTransaction {
  id: string;
  source_table: "donation_transactions" | "claim_requests" | "wallet_transactions";
  
  // Người gửi (UPDATED: added username + channel_name)
  sender_user_id: string | null;
  sender_display_name: string;
  sender_username: string;
  sender_avatar_url: string | null;
  sender_channel_name: string;
  wallet_from: string | null;
  wallet_from_full: string | null;
  
  // Người nhận (UPDATED: added username + channel_name)
  receiver_user_id: string | null;
  receiver_display_name: string;
  receiver_username: string;
  receiver_avatar_url: string | null;
  receiver_channel_name: string;
  wallet_to: string | null;
  wallet_to_full: string | null;
  
  // Thông tin giao dịch
  token_symbol: string;
  amount: number;
  transaction_type: TransactionType;
  message: string | null;
  
  // Blockchain (REQUIRED: only onchain transactions)
  is_onchain: boolean;
  chain: string | null;
  tx_hash: string | null;
  explorer_url: string | null;
  
  // Biên nhận
  receipt_public_id: string | null;
  
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
  userId?: string;
}

export interface TransactionStats {
  totalCount: number;
  totalValue: number;
  todayCount: number;
  successCount: number;
  pendingCount: number;
}

interface UseTransactionHistoryOptions {
  publicMode?: boolean;
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
      
      // Use a much higher effective limit for wallet_transactions (largest table)
      const walletLimit = Math.max(limit, 1000);
      
      // ========== 1. Lấy donation_transactions (ONCHAIN ONLY) ==========
      let donationQuery = supabase
        .from("donation_transactions")
        .select("*")
        .eq("status", "success")
        .not("tx_hash", "is", null)  // CHỈ LẤY ONCHAIN
        .order("created_at", { ascending: false })
        .range(currentOffset, currentOffset + Math.max(limit, 500) - 1);
      
      // Nếu không phải public mode, chỉ lấy giao dịch của user hiện tại
      if (!publicMode && user?.id) {
        donationQuery = supabase
          .from("donation_transactions")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq("status", "success")
          .not("tx_hash", "is", null)
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);
      }
      
      const { data: donations, error: donationError } = await donationQuery;
      
      if (donationError) throw donationError;

      // ========== 2. Lấy claim_requests (THAY CHO reward_transactions) ==========
      let claimData: any[] = [];
      
      // Public mode: lấy tất cả claim success
      // Private mode: chỉ lấy của user
      const claimQuery = publicMode 
        ? supabase
            .from("claim_requests")
            .select("*")
            .eq("status", "success")
            .not("tx_hash", "is", null)
            .order("created_at", { ascending: false })
            .range(currentOffset, currentOffset + Math.max(limit, 500) - 1)
        : user?.id
          ? supabase
              .from("claim_requests")
              .select("*")
              .eq("user_id", user.id)
              .eq("status", "success")
              .not("tx_hash", "is", null)
              .order("created_at", { ascending: false })
              .range(currentOffset, currentOffset + limit - 1)
          : null;
      
      if (claimQuery) {
        const { data: claims, error: claimError } = await claimQuery;
        if (claimError) throw claimError;
        claimData = claims || [];
      }

      // ========== 3. Lấy wallet_transactions (ONCHAIN ONLY) ==========
      let walletData: any[] = [];
      
      // Lấy wallet_address của user trước để mở rộng query
      let userWalletAddress: string | null = null;
      if (!publicMode && user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", user.id)
          .single();
        userWalletAddress = profile?.wallet_address?.toLowerCase() || null;
      }
      
      // FIXED: Query 'completed' status (actual data uses 'completed', not 'success')
      // UPDATED: Sort by block_timestamp for better accuracy, fallback to created_at
      // EXPANDED: Query by both user_id AND wallet_address to catch all onchain txs
      let walletQuery;
      if (publicMode) {
        walletQuery = supabase
          .from("wallet_transactions")
          .select("*")
          .eq("status", "completed")
          .not("tx_hash", "is", null)
          .order("block_timestamp", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + walletLimit - 1);
      } else if (user?.id) {
        // Mở rộng: tìm theo cả user_id VÀ wallet_address
        const orConditions = [`from_user_id.eq.${user.id}`, `to_user_id.eq.${user.id}`];
        if (userWalletAddress) {
          orConditions.push(`from_address.ilike.${userWalletAddress}`);
          orConditions.push(`to_address.ilike.${userWalletAddress}`);
        }
        walletQuery = supabase
          .from("wallet_transactions")
          .select("*")
          .or(orConditions.join(","))
          .eq("status", "completed")
          .not("tx_hash", "is", null)
          .order("block_timestamp", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .range(currentOffset, currentOffset + walletLimit - 1);
      } else {
        walletQuery = null;
      }
      
      if (walletQuery) {
        const { data: wallets, error: walletError } = await walletQuery;
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

      claimData.forEach(c => {
        if (c.user_id) userIds.add(c.user_id);
      });

      walletData.forEach(w => {
        if (w.from_user_id) userIds.add(w.from_user_id);
        if (w.to_user_id) userIds.add(w.to_user_id);
      });

      // ========== 5. Fetch profiles, channels, và tokens ==========
      const [profilesRes, channelsRes, tokensRes] = await Promise.all([
        userIds.size > 0
          ? supabase.from("profiles").select("id, username, display_name, avatar_url, wallet_address").in("id", Array.from(userIds))
          : Promise.resolve({ data: [] }),
        userIds.size > 0
          ? supabase.from("channels").select("id, user_id, name").in("user_id", Array.from(userIds))
          : Promise.resolve({ data: [] }),
        tokenIds.size > 0
          ? supabase.from("donate_tokens").select("id, symbol, chain").in("id", Array.from(tokenIds))
          : Promise.resolve({ data: [] }),
      ]);

      // Build lookup maps
      const profilesMap: Record<string, ProfileData> = {};
      (profilesRes.data || []).forEach(p => { profilesMap[p.id] = p; });

      const channelsMap: Record<string, ChannelData> = {};
      (channelsRes.data || []).forEach(c => { channelsMap[c.user_id] = c; });

      const tokensMap: Record<string, any> = {};
      (tokensRes.data || []).forEach(t => { tokensMap[t.id] = t; });

      // ========== 6. Normalize donation_transactions ==========
      donations?.forEach(d => {
        const senderProfile = profilesMap[d.sender_id];
        const senderChannel = channelsMap[d.sender_id];
        const senderInfo = getUserDisplayInfo(senderProfile, senderChannel);
        
        const receiverProfile = profilesMap[d.receiver_id];
        const receiverChannel = channelsMap[d.receiver_id];
        const receiverInfo = getUserDisplayInfo(receiverProfile, receiverChannel);
        
        // CHECK SYSTEM WALLET OVERRIDE
        const senderSystemWallet = getSystemWalletDisplayInfo(senderProfile?.wallet_address);
        const receiverSystemWallet = getSystemWalletDisplayInfo(receiverProfile?.wallet_address);
        
        const finalSenderInfo = senderSystemWallet || senderInfo;
        const finalReceiverInfo = receiverSystemWallet || receiverInfo;
        
        const token = tokensMap[d.token_id];
        
        // UPDATED: "tip" → "gift", "donate" stays "donate"
        const transactionType: TransactionType = (d.context_type === "tip" || d.context_type === "donate") ? "gift" : "gift";
        
        allTransactions.push({
          id: d.id,
          source_table: "donation_transactions",
          
          sender_user_id: d.sender_id,
          sender_display_name: finalSenderInfo.displayName,
          sender_username: finalSenderInfo.username,
          sender_avatar_url: finalSenderInfo.avatarUrl,
          sender_channel_name: finalSenderInfo.channelName,
          wallet_from: formatAddress(senderProfile?.wallet_address),
          wallet_from_full: senderProfile?.wallet_address || null,
          
          receiver_user_id: d.receiver_id,
          receiver_display_name: finalReceiverInfo.displayName,
          receiver_username: finalReceiverInfo.username,
          receiver_avatar_url: finalReceiverInfo.avatarUrl,
          receiver_channel_name: finalReceiverInfo.channelName,
          wallet_to: formatAddress(receiverProfile?.wallet_address),
          wallet_to_full: receiverProfile?.wallet_address || null,
          
          token_symbol: token?.symbol || "CAMLY",
          amount: d.amount,
          transaction_type: transactionType,
          message: d.message,
          
          is_onchain: true,  // Luôn true vì đã filter
          chain: d.chain || token?.chain || "BSC",
          tx_hash: d.tx_hash,
          explorer_url: getExplorerUrl(d.chain || token?.chain, d.tx_hash),
          
          status: d.status as TransactionStatus,
          created_at: d.created_at,
          receipt_public_id: d.receipt_public_id || null,
          updated_at: null,
        });
      });

      // ========== 7. Normalize claim_requests (THAY CHO reward_transactions) ==========
      claimData.forEach(c => {
        const userProfile = profilesMap[c.user_id];
        const userChannel = channelsMap[c.user_id];
        const userInfo = getUserDisplayInfo(userProfile, userChannel);
        
        // CHECK SYSTEM WALLET for receiver (user might be system wallet too)
        const receiverSystemWallet = getSystemWalletDisplayInfo(userProfile?.wallet_address);
        const finalReceiverInfo = receiverSystemWallet || userInfo;
        
        allTransactions.push({
          id: c.id,
          source_table: "claim_requests",
          
          // Sender: FUN PLAY Treasury (Admin wallet) - Dùng config
          sender_user_id: null,
          sender_display_name: "FUN PLAY TREASURY",
          sender_username: "@funplaytreasury",
          sender_avatar_url: "/images/fun-play-wallet-icon.png",
          sender_channel_name: "FUN PLAY TREASURY",
          wallet_from: "0x1DC2...998",
          wallet_from_full: "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",
          
          // Receiver: User
          receiver_user_id: c.user_id,
          receiver_display_name: finalReceiverInfo.displayName,
          receiver_username: finalReceiverInfo.username,
          receiver_avatar_url: finalReceiverInfo.avatarUrl,
          receiver_channel_name: finalReceiverInfo.channelName,
          wallet_to: formatAddress(c.wallet_address),
          wallet_to_full: c.wallet_address,
          
          token_symbol: "CAMLY",
          amount: c.amount,
          transaction_type: "claim",
          message: "Rút thưởng CAMLY về ví",
          
          is_onchain: true,
          chain: "BSC",
          tx_hash: c.tx_hash,
          explorer_url: getExplorerUrl("BSC", c.tx_hash),
          
          status: "success",
          created_at: c.processed_at || c.created_at,
          receipt_public_id: null,
          updated_at: null,
        });
      });

      // ========== 8. Normalize wallet_transactions (→ "gift") ==========
      walletData.forEach(w => {
        const fromProfile = profilesMap[w.from_user_id];
        const fromChannel = channelsMap[w.from_user_id];
        const fromInfo = getUserDisplayInfo(fromProfile, fromChannel);
        
        const toProfile = profilesMap[w.to_user_id];
        const toChannel = channelsMap[w.to_user_id];
        const toInfo = getUserDisplayInfo(toProfile, toChannel);
        
        // CHECK SYSTEM WALLET OVERRIDE for both sender and receiver
        const senderSystemWallet = getSystemWalletDisplayInfo(w.from_address);
        const receiverSystemWallet = getSystemWalletDisplayInfo(w.to_address);
        
        // Fallback: hiển thị địa chỉ ví rút gọn khi không có profile và không phải ví hệ thống
        const fallbackFromInfo = {
          displayName: formatAddress(w.from_address),
          username: formatAddress(w.from_address),
          avatarUrl: null as string | null,
          channelName: formatAddress(w.from_address),
        };
        const fallbackToInfo = {
          displayName: formatAddress(w.to_address),
          username: formatAddress(w.to_address),
          avatarUrl: null as string | null,
          channelName: formatAddress(w.to_address),
        };
        
        const finalFromInfo = senderSystemWallet || (fromProfile ? fromInfo : fallbackFromInfo);
        const finalToInfo = receiverSystemWallet || (toProfile ? toInfo : fallbackToInfo);
        
        allTransactions.push({
          id: w.id,
          source_table: "wallet_transactions",
          
          sender_user_id: w.from_user_id,
          sender_display_name: finalFromInfo.displayName,
          sender_username: finalFromInfo.username,
          sender_avatar_url: finalFromInfo.avatarUrl,
          sender_channel_name: finalFromInfo.channelName,
          wallet_from: formatAddress(w.from_address),
          wallet_from_full: w.from_address,
          
          receiver_user_id: w.to_user_id,
          receiver_display_name: finalToInfo.displayName,
          receiver_username: finalToInfo.username,
          receiver_avatar_url: finalToInfo.avatarUrl,
          receiver_channel_name: finalToInfo.channelName,
          wallet_to: formatAddress(w.to_address),
          wallet_to_full: w.to_address,
          
          token_symbol: w.token_type || "CAMLY",
          amount: w.amount,
          transaction_type: "gift",  // UPDATED: "transfer" → "gift"
          message: null,
          
          is_onchain: true,
          chain: "BSC",
          tx_hash: w.tx_hash,
          explorer_url: getExplorerUrl("BSC", w.tx_hash),
          
          status: w.status === 'completed' ? 'success' : w.status as TransactionStatus,
          created_at: w.created_at,
          receipt_public_id: null,
          updated_at: null,
        });
      });

      // ========== 9. Loại bỏ trùng lặp theo tx_hash ==========
      const SOURCE_PRIORITY: Record<string, number> = {
        "donation_transactions": 1,
        "claim_requests": 2,
        "wallet_transactions": 3,
      };

      const txHashMap = new Map<string, number>();
      const deduped: UnifiedTransaction[] = [];

      for (let i = 0; i < allTransactions.length; i++) {
        const tx = allTransactions[i];
        if (!tx.tx_hash) {
          deduped.push(tx);
          continue;
        }
        const existing = txHashMap.get(tx.tx_hash);
        if (existing === undefined) {
          txHashMap.set(tx.tx_hash, deduped.length);
          deduped.push(tx);
        } else {
          const existingPriority = SOURCE_PRIORITY[deduped[existing].source_table] || 99;
          const currentPriority = SOURCE_PRIORITY[tx.source_table] || 99;
          if (currentPriority < existingPriority) {
            deduped[existing] = tx;
          }
        }
      }

      // ========== 10. Sắp xếp theo thời gian ==========
      deduped.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // ========== 10. Fetch stats from server-side RPC ==========
      // userWalletAddress đã được lấy ở bước 3
      
      const { data: serverStats } = await supabase.rpc('get_transaction_stats', {
        p_wallet_address: publicMode ? null : (userWalletAddress || null)
      });
      
      const newStats: TransactionStats = {
        totalCount: (serverStats as any)?.totalCount ?? deduped.length,
        totalValue: (serverStats as any)?.totalValue ?? deduped.reduce((sum, t) => sum + t.amount, 0),
        todayCount: (serverStats as any)?.todayCount ?? 0,
        successCount: (serverStats as any)?.totalCount ?? deduped.length,
        pendingCount: 0,
      };

      setStats(newStats);
      setTransactions(deduped);
      setFilteredTransactions(deduped);
      setHasMore(
        (donations?.length || 0) >= limit || 
        claimData.length >= limit || 
        walletData.length >= walletLimit
      );
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

    // Search filter (UPDATED: include username)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.sender_display_name.toLowerCase().includes(search) ||
        t.sender_username.toLowerCase().includes(search) ||
        t.receiver_display_name.toLowerCase().includes(search) ||
        t.receiver_username.toLowerCase().includes(search) ||
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

  // ========== Realtime Subscriptions ==========
  useEffect(() => {
    if (!user?.id && !publicMode) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchTransactions(true);
      }, 500);
    };

    const channel = supabase
      .channel('realtime-tx-history')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wallet_transactions',
      }, debouncedRefresh)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donation_transactions',
      }, debouncedRefresh)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'donation_transactions',
      }, debouncedRefresh)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'claim_requests',
      }, debouncedRefresh)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'claim_requests',
      }, debouncedRefresh)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, publicMode]);

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
