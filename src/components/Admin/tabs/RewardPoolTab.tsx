import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
}

interface PoolStats {
  totalClaimed: number;
  totalPending: number;
  totalFailed: number;
  claimCount: number;
  pendingCount: number;
}

const RewardPoolTab = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [stats, setStats] = useState<PoolStats>({
    totalClaimed: 0,
    totalPending: 0,
    totalFailed: 0,
    claimCount: 0,
    pendingCount: 0
  });
  const [poolBalance, setPoolBalance] = useState<string>("--");
  const [bnbBalance, setBnbBalance] = useState<string>("--");
  const [adminWallet, setAdminWallet] = useState<string>("--");

  const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";
  const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchClaimHistory(), fetchPoolStats(), fetchPoolBalance()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
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

      // Fetch usernames for each claim
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      setClaims(
        data?.map(c => ({
          ...c,
          username: profileMap.get(c.user_id) || "Unknown"
        })) || []
      );
    } catch (error) {
      console.error("Error fetching claim history:", error);
    }
  };

  const fetchPoolStats = async () => {
    try {
      const { data: claimData, error } = await supabase
        .from("claim_requests")
        .select("status, amount");

      if (error) throw error;

      const newStats: PoolStats = {
        totalClaimed: 0,
        totalPending: 0,
        totalFailed: 0,
        claimCount: 0,
        pendingCount: 0
      };

      claimData?.forEach(c => {
        if (c.status === "success") {
          newStats.totalClaimed += Number(c.amount);
          newStats.claimCount++;
        } else if (c.status === "pending") {
          newStats.totalPending += Number(c.amount);
          newStats.pendingCount++;
        } else if (c.status === "failed") {
          newStats.totalFailed += Number(c.amount);
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching pool stats:", error);
    }
  };

  const fetchPoolBalance = async () => {
    try {
      // This would typically be done via an edge function for security
      // For demo, we'll show a placeholder
      // In production, create an edge function to check the admin wallet balance
      setPoolBalance("Loading...");
      setBnbBalance("Loading...");
      setAdminWallet("0x...Admin");
      
      // Note: In production, call an edge function like:
      // const { data } = await supabase.functions.invoke('get-pool-balance');
    } catch (error) {
      console.error("Error fetching pool balance:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Thành công</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Đang xử lý</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Thất bại</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pool Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                Số dư CAMLY Pool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">{poolBalance}</p>
              <p className="text-xs text-muted-foreground mt-1">Trong ví admin</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-500" />
                Số dư BNB (Gas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-500">{bnbBalance}</p>
              <p className="text-xs text-muted-foreground mt-1">Cho phí giao dịch</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Đã claim tổng cộng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{formatNumber(stats.totalClaimed)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.claimCount} giao dịch thành công</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{formatNumber(stats.totalClaimed)}</p>
            <p className="text-xs text-muted-foreground">CAMLY đã claim</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{formatNumber(stats.totalPending)}</p>
            <p className="text-xs text-muted-foreground">Đang xử lý</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{formatNumber(stats.totalFailed)}</p>
            <p className="text-xs text-muted-foreground">Thất bại</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.claimCount}</p>
            <p className="text-xs text-muted-foreground">Tổng giao dịch</p>
          </div>
        </Card>
      </div>

      {/* Claim History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Lịch sử Claim
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
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
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-right py-3 px-2">Số lượng</th>
                    <th className="text-left py-3 px-2">Ví nhận</th>
                    <th className="text-center py-3 px-2">Trạng thái</th>
                    <th className="text-center py-3 px-2">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b border-muted/50 hover:bg-muted/30">
                      <td className="py-3 px-2 text-muted-foreground">
                        {format(new Date(claim.created_at), "dd/MM HH:mm", { locale: vi })}
                      </td>
                      <td className="py-3 px-2 font-medium">@{claim.username}</td>
                      <td className="py-3 px-2 text-right font-bold text-yellow-500">
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
                          <a
                            href={`https://bscscan.com/tx/${claim.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : claim.error_message ? (
                          <span className="text-xs text-red-500" title={claim.error_message}>
                            Lỗi
                          </span>
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
