import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, ExternalLink, CheckCircle2, Clock, XCircle, 
  ChevronDown, ChevronUp, Coins, TrendingUp, RefreshCcw 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface FunMoneyClaim {
  id: string;
  amount: number;
  wallet_address: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  gas_fee: number | null;
}

interface ClaimStats {
  totalClaimed: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
}

const statusConfig = {
  pending: {
    label: "Đang xử lý",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  completed: {
    label: "Thành công",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  failed: {
    label: "Thất bại",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
};

export function FunMoneyClaimHistory() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<FunMoneyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchClaims = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("claim_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("claim_type", "fun_money")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("Error fetching FUN Money claim history:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const stats: ClaimStats = claims.reduce(
    (acc, claim) => {
      if (claim.status === "completed") {
        acc.totalClaimed += Number(claim.amount);
        acc.successCount++;
      } else if (claim.status === "pending") {
        acc.pendingCount++;
      } else if (claim.status === "failed") {
        acc.failedCount++;
      }
      return acc;
    },
    { totalClaimed: 0, successCount: 0, pendingCount: 0, failedCount: 0 }
  );

  if (loading) {
    return (
      <Card className="animate-pulse border border-border/50">
        <CardContent className="p-6 h-48" />
      </Card>
    );
  }

  const displayClaims = isExpanded ? claims : claims.slice(0, 5);

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Lịch Sử Claim FUN Money
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{claims.length} giao dịch</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchClaims}
              disabled={loading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {claims.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">
                {stats.successCount}
              </p>
              <p className="text-xs text-muted-foreground">Thành công</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-600">
                {stats.pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">Đang xử lý</p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-primary">
                {stats.totalClaimed.toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-muted-foreground">Tổng FUN</p>
            </div>
          </div>
        )}

        {/* Claim List */}
        {claims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có lịch sử claim FUN Money</p>
            <p className="text-sm mt-1">
              Khi bạn claim FUN Money về ví Web3, giao dịch sẽ hiển thị tại đây
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className={isExpanded ? "h-[450px]" : "h-auto"}>
              <div className="space-y-3">
                {displayClaims.map((claim) => {
                  const config = statusConfig[claim.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={claim.id}
                      className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:scale-[1.005]`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
                          <div>
                            <div className="font-bold text-lg">
                              {Number(claim.amount).toLocaleString("vi-VN")} FUN
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(claim.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge className={`${config.bgColor} ${config.color} border-none`}>
                            {config.label}
                          </Badge>
                          {claim.tx_hash && (
                            <a
                              href={`https://bscscan.com/tx/${claim.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1 justify-end"
                            >
                              <ExternalLink className="w-3 h-3" />
                              BscScan
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">
                          Ví: {claim.wallet_address.slice(0, 10)}...{claim.wallet_address.slice(-8)}
                        </span>
                        {claim.gas_fee != null && claim.gas_fee > 0 && (
                          <span>Gas: {claim.gas_fee} BNB</span>
                        )}
                      </div>

                      {claim.processed_at && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Xử lý: {format(new Date(claim.processed_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                      )}

                      {claim.error_message && (
                        <div className="mt-2 text-xs text-red-400">
                          Lỗi: {claim.error_message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {claims.length > 5 && (
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Xem thêm ({claims.length - 5} giao dịch)
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
