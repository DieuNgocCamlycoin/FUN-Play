import { useState, useEffect, useCallback, useRef } from "react";
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
  Radio,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { SYSTEM_WALLETS } from "@/config/systemWallets";

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
  recipient_username: string;
  recipient_avatar: string | null;
  recipient_channel: string | null;
}

const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const bscscanAddr = (addr: string) => `https://bscscan.com/address/${addr}`;
const bscscanTx = (hash: string) => `https://bscscan.com/tx/${hash}`;
const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

const RewardPoolTab = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [stats, setStats] = useState<PoolStats>({ totalClaimed: 0, totalPending: 0, totalFailed: 0, claimCount: 0, pendingCount: 0 });
  const [poolBalance, setPoolBalance] = useState<string>("--");
  const [bnbBalance, setBnbBalance] = useState<string>("--");
  const [manualStats, setManualStats] = useState({ wallet1Total: 0, wallet2Total: 0, totalManual: 0 });
  const [manualTxs, setManualTxs] = useState<ManualTx[]>([]);
  const [isLive, setIsLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all data
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    await Promise.all([fetchClaimHistory(), fetchPoolStats(), fetchPoolBalance(), fetchManualRewards()]);
    if (showLoading) setLoading(false);
  }, []);

  // Initial load + real-time interval
  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => fetchData(false), 2000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLive, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  };

  const fetchClaimHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("claim_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      const { data: channels } = await supabase
        .from("channels")
        .select("user_id, name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const channelMap = new Map(channels?.map(c => [c.user_id, c.name]) || []);

      setClaims(
        data?.map(c => {
          const prof = profileMap.get(c.user_id);
          return {
            ...c,
            username: prof?.username || "unknown",
            avatar_url: prof?.avatar_url || null,
            channel_name: channelMap.get(c.user_id) || prof?.username || "unknown",
          };
        }) || []
      );
    } catch (error) {
      console.error("Error fetching claim history:", error);
    }
  };

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
    } catch (error) {
      console.error("Error fetching pool stats:", error);
    }
  };

  const fetchPoolBalance = async () => {
    try {
      setPoolBalance("Đang tải...");
      setBnbBalance("Đang tải...");
      const { data, error } = await supabase.functions.invoke('admin-wallet-balance');
      if (error) throw error;
      if (data?.success) {
        setPoolBalance(`${formatNumber(Math.floor(data.data.camlyBalance))} CAMLY`);
        setBnbBalance(`${data.data.bnbBalance.toFixed(4)} BNB`);
      } else {
        setPoolBalance("Lỗi tải"); setBnbBalance("Lỗi tải");
      }
    } catch (error) {
      console.error("Error fetching pool balance:", error);
      setPoolBalance("Không thể tải"); setBnbBalance("Không thể tải");
    }
  };

  const fetchManualRewards = async () => {
    try {
      const w1 = SYSTEM_WALLETS.TREASURY.address.toLowerCase();
      const w2 = SYSTEM_WALLETS.PERSONAL.address.toLowerCase();
      const camly = CAMLY_TOKEN_ADDRESS.toLowerCase();

      const { data: txs, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("status", "completed")
        .ilike("token_contract", camly)
        .or(`from_address.ilike.${w1},from_address.ilike.${w2}`)
        .order("block_timestamp", { ascending: false })
        .limit(200);
      if (error) throw error;

      let w1Total = 0, w2Total = 0;
      (txs || []).forEach(tx => {
        const from = tx.from_address?.toLowerCase();
        if (from === w1) w1Total += Number(tx.amount);
        else if (from === w2) w2Total += Number(tx.amount);
      });
      setManualStats({ wallet1Total: w1Total, wallet2Total: w2Total, totalManual: w1Total + w2Total });

      // Get profiles + channels for recipients
      const toAddresses = [...new Set((txs || []).map(t => t.to_address?.toLowerCase()))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, wallet_address")
        .limit(1000);
      const { data: channels } = await supabase
        .from("channels")
        .select("user_id, name")
        .limit(1000);

      const addrToProfile = new Map<string, { username: string; avatar_url: string | null; user_id: string }>();
      profiles?.forEach(p => {
        if (p.wallet_address) addrToProfile.set(p.wallet_address.toLowerCase(), { username: p.username || "unknown", avatar_url: p.avatar_url, user_id: p.id });
      });
      const userToChannel = new Map<string, string>();
      channels?.forEach(c => { userToChannel.set(c.user_id, c.name); });

      setManualTxs(
        (txs || []).slice(0, 50).map(tx => {
          const prof = addrToProfile.get(tx.to_address?.toLowerCase() || "");
          const channelName = prof ? userToChannel.get(prof.user_id) : null;
          return {
            id: tx.id,
            amount: Number(tx.amount),
            tx_hash: tx.tx_hash,
            block_timestamp: tx.block_timestamp,
            from_address: tx.from_address,
            to_address: tx.to_address,
            from_wallet: tx.from_address?.toLowerCase() === w1 ? "Ví 1" : "Ví 2",
            recipient_username: prof?.username || shortenAddress(tx.to_address || ""),
            recipient_avatar: prof?.avatar_url || null,
            recipient_channel: channelName || prof?.username || null,
          };
        })
      );
    } catch (err) {
      console.error("Error fetching manual rewards:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Thành công</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Đang xử lý</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Thất bại</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalSystemRewards = stats.totalClaimed + manualStats.totalManual;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live badge & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">CAMLY Rewards</h2>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              isLive ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-muted text-muted-foreground border border-muted"
            }`}
          >
            <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "Live" : "Paused"}
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Total System Rewards - Hero Card */}
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
                  = Đã claim ({formatNumber(Math.floor(stats.totalClaimed))}) + Thưởng tay ({formatNumber(Math.floor(manualStats.totalManual))})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pool Balance + Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">CAMLY Pool</span>
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
          <p className="text-lg font-bold text-rose-500">{formatNumber(Math.floor(manualStats.totalManual))}</p>
          <p className="text-xs text-muted-foreground">Từ 2 ví</p>
        </Card>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ví tặng thưởng 1 */}
        <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-rose-500" />
              Ví tặng thưởng 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-500">{formatNumber(Math.floor(manualStats.wallet1Total))} <span className="text-sm font-normal">CAMLY</span></p>
            <a href={bscscanAddr(SYSTEM_WALLETS.TREASURY.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 font-mono">
              {shortenAddress(SYSTEM_WALLETS.TREASURY.address)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>

        {/* Ví tặng thưởng 2 */}
        <Card className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 border-fuchsia-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-fuchsia-500" />
              Ví tặng thưởng 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-fuchsia-500">{formatNumber(Math.floor(manualStats.wallet2Total))} <span className="text-sm font-normal">CAMLY</span></p>
            <a href={bscscanAddr(SYSTEM_WALLETS.PERSONAL.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 font-mono">
              {shortenAddress(SYSTEM_WALLETS.PERSONAL.address)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Manual Rewards Recent Transactions */}
      {manualTxs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandCoins className="w-5 h-5 text-rose-500" />
              Thưởng bằng tay gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Thời gian</th>
                    <th className="text-left py-3 px-2">Từ ví</th>
                    <th className="text-left py-3 px-2">Người nhận</th>
                    <th className="text-right py-3 px-2">Số lượng</th>
                    <th className="text-center py-3 px-2">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {manualTxs.map((tx) => (
                    <tr key={tx.id} className="border-b border-muted/50 hover:bg-muted/30">
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {tx.block_timestamp ? format(new Date(tx.block_timestamp), "dd/MM HH:mm", { locale: vi }) : "--"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">{tx.from_wallet}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <a href={`/c/${tx.recipient_username}`} className="flex items-center gap-2 hover:underline">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={tx.recipient_avatar || undefined} />
                            <AvatarFallback className="text-[10px]">{(tx.recipient_channel || tx.recipient_username)?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[120px]">{tx.recipient_channel || tx.recipient_username}</p>
                            <p className="text-xs text-muted-foreground">@{tx.recipient_username}</p>
                          </div>
                        </a>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-rose-500 whitespace-nowrap">
                        {formatNumber(Math.floor(tx.amount))}
                      </td>
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
                        <a href={`/c/${claim.username}`} className="flex items-center gap-2 hover:underline">
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
