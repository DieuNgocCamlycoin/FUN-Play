import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Coins, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  Wallet,
  TrendingUp,
  AlertTriangle,
  HandCoins,
  Award,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { SYSTEM_WALLETS } from "@/config/systemWallets";

// ── Types ──────────────────────────────────────────────

interface ClaimHistory {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  username?: string;
  avatar_url?: string;
  channel_name?: string;
}

interface PoolStats {
  totalClaimed: number;
  totalPending: number;
  totalFailed: number;
  claimCount: number;
  pendingCount: number;
}

interface ManualTx {
  id: string;
  amount: number;
  tx_hash: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  from_wallet: string;
  token_type: string;
  recipient_username: string;
  recipient_avatar: string | null;
  recipient_channel: string | null;
  recipient_user_id: string | null;
}

interface ManualStats {
  wallet1Camly: number;
  wallet1Usdt: number;
  wallet2Camly: number;
  wallet2Usdt: number;
  totalCamly: number;
  totalUsdt: number;
}

// ── Helpers ────────────────────────────────────────────

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const bscscanAddr = (addr: string) => `https://bscscan.com/address/${addr}`;
const bscscanTx = (hash: string) => `https://bscscan.com/tx/${hash}`;
const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

// Ngày giới hạn thống kê thưởng tay (CAMLY + USDT dùng chung khoảng)
const WALLET1_START = "2025-11-25T00:00:00Z"; // Ví 1: từ 25/11/2025
const WALLET1_END   = "2026-01-09T00:00:00Z"; // đến hết 8/1/2026
const WALLET2_START = "2026-01-14T00:00:00Z"; // Ví 2: từ 14/1/2026
const WALLET2_END   = "2026-01-18T00:00:00Z"; // đến 18/1/2026

// ── Component ──────────────────────────────────────────

const RewardPoolTab = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [stats, setStats] = useState<PoolStats>({ totalClaimed: 0, totalPending: 0, totalFailed: 0, claimCount: 0, pendingCount: 0 });
  const [poolBalance, setPoolBalance] = useState<string>("--");
  const [bnbBalance, setBnbBalance] = useState<string>("--");
  const [manualStats, setManualStats] = useState<ManualStats>({ wallet1Camly: 0, wallet1Usdt: 0, wallet2Camly: 0, wallet2Usdt: 0, totalCamly: 0, totalUsdt: 0 });
  const [manualTxs, setManualTxs] = useState<ManualTx[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<"w1" | "w2" | null>(null);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    await Promise.all([fetchClaimHistory(), fetchPoolStats(), fetchPoolBalance(showLoading), fetchManualRewards()]);
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => { fetchData(true); }, []);


  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  };

  // ── Fetch claim history ──
  const fetchClaimHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("claim_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds);
      const { data: channels } = await supabase.from("channels").select("user_id, name").in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const channelMap = new Map(channels?.map(c => [c.user_id, c.name]) || []);

      setClaims(
        data?.map(c => {
          const prof = profileMap.get(c.user_id);
          return { ...c, username: prof?.username || "unknown", avatar_url: prof?.avatar_url || null, channel_name: channelMap.get(c.user_id) || prof?.username || "unknown" };
        }) || []
      );
    } catch (error) { console.error("Error fetching claim history:", error); }
  };

  // ── Fetch pool stats ──
  const fetchPoolStats = async () => {
    try {
      const { data: claimData, error } = await supabase.from("claim_requests").select("status, amount");
      if (error) throw error;
      const newStats: PoolStats = { totalClaimed: 0, totalPending: 0, totalFailed: 0, claimCount: 0, pendingCount: 0 };
      claimData?.forEach(c => {
        if (c.status === "success") { newStats.totalClaimed += Number(c.amount); newStats.claimCount++; }
        else if (c.status === "pending") { newStats.totalPending += Number(c.amount); newStats.pendingCount++; }
        else if (c.status === "failed") { newStats.totalFailed += Number(c.amount); }
      });
      setStats(newStats);
    } catch (error) { console.error("Error fetching pool stats:", error); }
  };

  // ── Fetch pool balance ──
  const fetchPoolBalance = async (isInitial = false) => {
    try {
      if (isInitial) { setPoolBalance("Đang tải..."); setBnbBalance("Đang tải..."); }
      const { data, error } = await supabase.functions.invoke('admin-wallet-balance');
      if (error) throw error;
      if (data?.success) {
        setPoolBalance(`${formatNumber(Math.floor(data.data.camlyBalance))} CAMLY`);
        setBnbBalance(`${data.data.bnbBalance.toFixed(4)} BNB`);
      } else { setPoolBalance("Lỗi tải"); setBnbBalance("Lỗi tải"); }
    } catch (error) { console.error("Error fetching pool balance:", error); setPoolBalance("Không thể tải"); setBnbBalance("Không thể tải"); }
  };

  // ── Fetch manual rewards (CAMLY + USDT, with date filtering) ──
  const fetchManualRewards = async () => {
    try {
      const w1 = SYSTEM_WALLETS.TREASURY.address.toLowerCase();
      const w2 = SYSTEM_WALLETS.PERSONAL.address.toLowerCase();

      // Lấy TẤT CẢ giao dịch từ 2 ví (không lọc token_contract)
      const { data: txs, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("status", "completed")
        .or(`from_address.ilike.${w1},from_address.ilike.${w2}`)
        .order("block_timestamp", { ascending: false })
        .limit(500);
      if (error) throw error;

      // Tính tổng theo ví + token_type + ngày giới hạn
      let w1Camly = 0, w1Usdt = 0, w2Camly = 0, w2Usdt = 0;
      let missingTimestampCount = 0;
      (txs || []).forEach(tx => {
        const from = tx.from_address?.toLowerCase();
        const tokenType = (tx.token_type || "").toUpperCase();
        const ts = tx.block_timestamp;
        const isUsdt = tokenType.includes("USDT") || tokenType.includes("USD");

        if (from === w1) {
          if (ts && ts >= WALLET1_START && ts < WALLET1_END) {
            if (isUsdt) w1Usdt += Number(tx.amount);
            else w1Camly += Number(tx.amount);
          }
          if (!ts) missingTimestampCount++;
        } else if (from === w2) {
          if (ts && ts >= WALLET2_START && ts < WALLET2_END) {
            if (isUsdt) w2Usdt += Number(tx.amount);
            else w2Camly += Number(tx.amount);
          }
          if (!ts) missingTimestampCount++;
        }
      });
      if (missingTimestampCount > 0) console.warn(`${missingTimestampCount} giao dịch thiếu block_timestamp, bỏ qua`);

      setManualStats({
        wallet1Camly: w1Camly, wallet1Usdt: w1Usdt,
        wallet2Camly: w2Camly, wallet2Usdt: w2Usdt,
        totalCamly: w1Camly + w2Camly, totalUsdt: w1Usdt + w2Usdt,
      });

      // Get profiles for recipients
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url, wallet_address").limit(1000);
      const { data: channels } = await supabase.from("channels").select("user_id, name").limit(1000);

      const addrToProfile = new Map<string, { username: string; avatar_url: string | null; user_id: string }>();
      profiles?.forEach(p => {
        if (p.wallet_address) {
          const key = p.wallet_address.toLowerCase();
          const existing = addrToProfile.get(key);
          // Ưu tiên profile có avatar khi trùng wallet address
          if (!existing || (!existing.avatar_url && p.avatar_url)) {
            addrToProfile.set(key, { username: p.username || "unknown", avatar_url: p.avatar_url, user_id: p.id });
          }
        }
      });
      const userToChannel = new Map<string, string>();
      channels?.forEach(c => { userToChannel.set(c.user_id, c.name); });

      // Lọc bảng giao dịch theo mốc cutoff (đồng bộ với thẻ tổng)
      const filteredForTable = (txs || []).filter(tx => {
        const from = tx.from_address?.toLowerCase();
        const ts = tx.block_timestamp;
        if (!ts) return false;
        if (from === w1) return ts >= WALLET1_START && ts < WALLET1_END;
        if (from === w2) return ts >= WALLET2_START && ts < WALLET2_END;
        return false;
      });

      setManualTxs(
        filteredForTable.slice(0, 50).map(tx => {
          const prof = addrToProfile.get(tx.to_address?.toLowerCase() || "");
          const channelName = prof ? userToChannel.get(prof.user_id) : null;
          const tokenType = (tx.token_type || "CAMLY").toUpperCase();
          return {
            id: tx.id,
            amount: Number(tx.amount),
            tx_hash: tx.tx_hash,
            block_timestamp: tx.block_timestamp,
            from_address: tx.from_address,
            to_address: tx.to_address,
            from_wallet: tx.from_address?.toLowerCase() === w1 ? "Ví 1" : "Ví 2",
            token_type: tokenType.includes("USDT") || tokenType.includes("USD") ? "USDT" : "CAMLY",
            recipient_username: prof?.username || shortenAddress(tx.to_address || ""),
            recipient_avatar: prof?.avatar_url || null,
            recipient_channel: channelName || prof?.username || null,
            recipient_user_id: prof?.user_id || null,
          };
        })
      );
    } catch (err) { console.error("Error fetching manual rewards:", err); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Thành công</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Đang xử lý</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Thất bại</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTokenBadge = (tokenType: string) => {
    if (tokenType === "USDT") return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5">USDT</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px] px-1.5">CAMLY</Badge>;
  };

  const totalSystemRewards = stats.totalClaimed + manualStats.totalCamly;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">CAMLY Rewards</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Hero: Tổng đã tặng thưởng */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/30">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đã tặng thưởng hệ thống</p>
                <p className="text-3xl font-bold">{formatNumber(Math.floor(totalSystemRewards))} <span className="text-base font-normal text-muted-foreground">CAMLY</span></p>
                <p className="text-xs text-muted-foreground mt-1">
                  = Đã claim ({formatNumber(Math.floor(stats.totalClaimed))}) + Thưởng tay ({formatNumber(Math.floor(manualStats.totalCamly))})
                </p>
                {manualStats.totalUsdt > 0 && (
                  <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    + {formatNumber(Math.floor(manualStats.totalUsdt))} USDT đã tặng
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">FUN PLAY TREASURY Balance</span>
          </div>
          <p className="text-lg font-bold text-yellow-500">{poolBalance}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-cyan-500" />
            <span className="text-xs text-muted-foreground">BNB Gas</span>
          </div>
          <p className="text-lg font-bold text-cyan-500">{bnbBalance}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Đã claim</span>
          </div>
          <p className="text-lg font-bold text-green-500">{formatNumber(Math.floor(stats.totalClaimed))}</p>
          <p className="text-xs text-muted-foreground">{stats.claimCount} giao dịch</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <HandCoins className="w-4 h-4 text-rose-500" />
            <span className="text-xs text-muted-foreground">Thưởng tay</span>
          </div>
          <p className="text-lg font-bold text-rose-500">{formatNumber(Math.floor(manualStats.totalCamly))}</p>
          {manualStats.totalUsdt > 0 && <p className="text-xs text-emerald-500">+ {formatNumber(Math.floor(manualStats.totalUsdt))} USDT</p>}
        </Card>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ví 1 */}
        <Card 
          className={`bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/30 cursor-pointer transition-all hover:ring-2 hover:ring-rose-500/40 ${selectedWallet === "w1" ? "ring-2 ring-rose-500/60" : ""}`}
          onClick={() => setSelectedWallet(s => s === "w1" ? null : "w1")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-rose-500" />
              Ví tặng thưởng 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-500">{formatNumber(Math.floor(manualStats.wallet1Camly))} <span className="text-sm font-normal">CAMLY</span></p>
            <p className="text-lg font-bold text-emerald-500">{formatNumber(Math.floor(manualStats.wallet1Usdt))} <span className="text-sm font-normal">USDT</span></p>
            <p className="text-[10px] text-muted-foreground mt-1">25/11/2025 – 8/1/2026</p>
            <a href={bscscanAddr(SYSTEM_WALLETS.TREASURY.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 font-mono" onClick={e => e.stopPropagation()}>
              {shortenAddress(SYSTEM_WALLETS.TREASURY.address)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Ví 2 */}
        <Card 
          className={`bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 border-fuchsia-500/30 cursor-pointer transition-all hover:ring-2 hover:ring-fuchsia-500/40 ${selectedWallet === "w2" ? "ring-2 ring-fuchsia-500/60" : ""}`}
          onClick={() => setSelectedWallet(s => s === "w2" ? null : "w2")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-fuchsia-500" />
              Ví tặng thưởng 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-fuchsia-500">{formatNumber(Math.floor(manualStats.wallet2Camly))} <span className="text-sm font-normal">CAMLY</span></p>
            <p className="text-lg font-bold text-emerald-500">{formatNumber(Math.floor(manualStats.wallet2Usdt))} <span className="text-sm font-normal">USDT</span></p>
            <p className="text-[10px] text-muted-foreground mt-1">14/1/2026 – 18/1/2026</p>
            <a href={bscscanAddr(SYSTEM_WALLETS.PERSONAL.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 font-mono" onClick={e => e.stopPropagation()}>
              {shortenAddress(SYSTEM_WALLETS.PERSONAL.address)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Selected Wallet Detail Table */}
      {selectedWallet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandCoins className={`w-5 h-5 ${selectedWallet === "w1" ? "text-rose-500" : "text-fuchsia-500"}`} />
              Chi tiết {selectedWallet === "w1" ? "Ví 1" : "Ví 2"} ({selectedWallet === "w1" ? "25/11/2025 – 8/1/2026" : "14/1/2026 – 18/1/2026"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Thời gian</th>
                    <th className="text-left py-3 px-2">Người nhận</th>
                    <th className="text-right py-3 px-2">Số lượng</th>
                    <th className="text-center py-3 px-2">Token</th>
                    <th className="text-center py-3 px-2">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {manualTxs.filter(tx => tx.from_wallet === (selectedWallet === "w1" ? "Ví 1" : "Ví 2")).map((tx) => (
                    <tr key={tx.id} className="border-b border-muted/50 hover:bg-muted/30">
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {tx.block_timestamp ? format(new Date(tx.block_timestamp), "dd/MM HH:mm", { locale: vi }) : "--"}
                      </td>
                      <td className="py-3 px-2">
                        {tx.recipient_user_id ? (
                          <a href={`/profile/${tx.recipient_user_id}`} className="flex items-center gap-2 hover:underline">
                            <Avatar className="w-6 h-6">
                              {tx.recipient_avatar ? <AvatarImage src={tx.recipient_avatar} /> : null}
                              <AvatarFallback className="text-[10px]">{(tx.recipient_channel || tx.recipient_username)?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[120px]">{tx.recipient_channel || tx.recipient_username}</p>
                            </div>
                          </a>
                        ) : (
                          <a href={bscscanAddr(tx.to_address)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary">
                            {shortenAddress(tx.to_address)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className={`py-3 px-2 text-right font-bold whitespace-nowrap ${tx.token_type === "USDT" ? "text-emerald-500" : "text-yellow-500"}`}>
                        {formatNumber(Math.floor(tx.amount))}
                      </td>
                      <td className="py-3 px-2 text-center">{getTokenBadge(tx.token_type)}</td>
                      <td className="py-3 px-2 text-center">
                        <a href={bscscanTx(tx.tx_hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Lịch sử Claim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có giao dịch claim nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Thời gian</th>
                    <th className="text-left py-3 px-2">Người nhận</th>
                    <th className="text-right py-3 px-2">Số lượng</th>
                    <th className="text-left py-3 px-2">Ví nhận</th>
                    <th className="text-center py-3 px-2">Trạng thái</th>
                    <th className="text-center py-3 px-2">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b border-muted/50 hover:bg-muted/30">
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(claim.created_at), "dd/MM HH:mm", { locale: vi })}
                      </td>
                      <td className="py-3 px-2">
                        <a href={`/${claim.username}`} className="flex items-center gap-2 hover:underline">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={claim.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">{(claim.channel_name || claim.username)?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[120px]">{claim.channel_name}</p>
                            <p className="text-xs text-muted-foreground">@{claim.username}</p>
                          </div>
                        </a>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-yellow-500 whitespace-nowrap">
                        {formatNumber(claim.amount)}
                      </td>
                      <td className="py-3 px-2 font-mono text-xs">
                        {claim.wallet_address.slice(0, 6)}...{claim.wallet_address.slice(-4)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {claim.tx_hash ? (
                          <a href={bscscanTx(claim.tx_hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : claim.error_message ? (
                          <span className="text-xs text-red-500" title={claim.error_message}>Lỗi</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardPoolTab;
