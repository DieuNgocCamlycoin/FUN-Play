import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ExternalLink, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useClaimHistory } from "@/hooks/useClaimHistory";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ClaimHistoryWidgetProps {
  userId: string;
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
    label: "Hoàn thành",
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

export const ClaimHistoryWidget = ({ userId }: ClaimHistoryWidgetProps) => {
  const { claims, loading } = useClaimHistory(userId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-40" />
      </Card>
    );
  }

  const displayClaims = isExpanded ? claims : claims.slice(0, 3);

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            Lịch sử Claim
          </div>
          <Badge variant="secondary">{claims.length} giao dịch</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {claims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có lịch sử claim</p>
            <p className="text-sm mt-1">Kiếm đủ 100,000 CAMLY để claim!</p>
          </div>
        ) : (
          <>
            <ScrollArea className={isExpanded ? "h-[400px]" : "h-auto"}>
              <div className="space-y-3">
                {displayClaims.map((claim) => {
                  const status = statusConfig[claim.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={claim.id}
                      className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor} transition-all hover:scale-[1.01]`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                          <div>
                            <div className="font-bold text-lg">
                              {Number(claim.amount).toLocaleString()} CAMLY
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(claim.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge className={`${status.bgColor} ${status.color} border-none`}>
                            {status.label}
                          </Badge>
                          {claim.tx_hash && (
                            <a
                              href={`https://bscscan.com/tx/${claim.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-[#00E7FF] hover:underline mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              BscScan
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground truncate">
                        Ví: {claim.wallet_address.slice(0, 10)}...{claim.wallet_address.slice(-8)}
                      </div>

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

            {claims.length > 3 && (
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
                    Xem thêm ({claims.length - 3} giao dịch)
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
