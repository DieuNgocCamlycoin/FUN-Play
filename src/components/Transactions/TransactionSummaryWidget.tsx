import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Hash, TrendingUp, Trophy } from "lucide-react";
import type { UnifiedTransaction } from "@/hooks/useTransactionHistory";

type Direction = "both" | "sent" | "received";
type TokenFilter = "all" | "CAMLY" | "USDT" | "BNB" | "FUN";
type TimeFilter = "today" | "7d" | "30d" | "all";

interface Props {
  transactions: UnifiedTransaction[];
  currentUserId?: string;
}

const DIRECTION_OPTIONS: { value: Direction; label: string; icon: React.ReactNode }[] = [
  { value: "both", label: "Cả hai", icon: <ArrowLeftRight className="h-3.5 w-3.5" /> },
  { value: "sent", label: "Đã gửi", icon: <ArrowUpRight className="h-3.5 w-3.5" /> },
  { value: "received", label: "Đã nhận", icon: <ArrowDownLeft className="h-3.5 w-3.5" /> },
];

const TOKEN_OPTIONS: TokenFilter[] = ["all", "CAMLY", "USDT", "BNB", "FUN"];
const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "all", label: "Tất cả" },
];

export const TransactionSummaryWidget = ({ transactions, currentUserId }: Props) => {
  const [direction, setDirection] = useState<Direction>("both");
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const summary = useMemo(() => {
    let filtered = [...transactions];

    // Direction filter
    if (direction === "sent" && currentUserId) {
      filtered = filtered.filter(t => t.sender_user_id === currentUserId);
    } else if (direction === "received" && currentUserId) {
      filtered = filtered.filter(t => t.receiver_user_id === currentUserId);
    }

    // Token filter
    if (tokenFilter !== "all") {
      filtered = filtered.filter(t => t.token_symbol === tokenFilter);
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (timeFilter) {
        case "today":
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "7d":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      filtered = filtered.filter(t => new Date(t.created_at) >= cutoff);
    }

    const totalCount = filtered.length;
    const totalValue = filtered.reduce((sum, t) => sum + t.amount, 0);
    const largest = filtered.length > 0
      ? filtered.reduce((max, t) => t.amount > max.amount ? t : max, filtered[0])
      : null;

    // Breakdown by token
    const breakdown: Record<string, { count: number; value: number }> = {};
    filtered.forEach(t => {
      if (!breakdown[t.token_symbol]) {
        breakdown[t.token_symbol] = { count: 0, value: 0 };
      }
      breakdown[t.token_symbol].count++;
      breakdown[t.token_symbol].value += t.amount;
    });

    return { totalCount, totalValue, largest, breakdown, filtered };
  }, [transactions, direction, tokenFilter, timeFilter, currentUserId]);

  const formatValue = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
    return val.toFixed(2);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">📊 Tổng hợp Giao dịch</h3>

        {/* Direction tabs */}
        <div className="flex gap-1">
          {DIRECTION_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={direction === opt.value ? "default" : "outline"}
              onClick={() => setDirection(opt.value)}
              className="flex-1 gap-1 h-8 text-xs"
            >
              {opt.icon}
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Token filter */}
        <div className="flex gap-1 flex-wrap">
          {TOKEN_OPTIONS.map(tok => (
            <Button
              key={tok}
              size="sm"
              variant={tokenFilter === tok ? "default" : "outline"}
              onClick={() => setTokenFilter(tok)}
              className="h-7 px-2.5 text-xs"
            >
              {tok === "all" ? "Tất cả" : tok}
            </Button>
          ))}
        </div>

        {/* Time filter */}
        <div className="flex gap-1">
          {TIME_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={timeFilter === opt.value ? "default" : "outline"}
              onClick={() => setTimeFilter(opt.value)}
              className="flex-1 h-7 text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background/80 rounded-lg p-3 text-center border">
            <Hash className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{summary.totalCount}</p>
            <p className="text-[10px] text-muted-foreground">Tổng GD</p>
          </div>
          <div className="bg-background/80 rounded-lg p-3 text-center border">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{formatValue(summary.totalValue)} <span className="text-xs font-medium text-muted-foreground">{tokenFilter !== "all" ? tokenFilter : "tokens"}</span></p>
            <p className="text-[10px] text-muted-foreground">Tổng giá trị</p>
          </div>
          <div className="bg-background/80 rounded-lg p-3 text-center border">
            <Trophy className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">
              {summary.largest ? <>{formatValue(summary.largest.amount)} <span className="text-xs font-medium text-muted-foreground">{summary.largest.token_symbol}</span></> : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">GD lớn nhất</p>
          </div>
        </div>

        {/* Token breakdown (when "all" token selected) */}
        {tokenFilter === "all" && Object.keys(summary.breakdown).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Phân loại theo token:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(summary.breakdown)
                .sort((a, b) => b[1].value - a[1].value)
                .map(([token, data]) => (
                  <div key={token} className="flex items-center justify-between bg-background/60 rounded px-2 py-1 border text-xs">
                    <span className="font-medium text-foreground">{token}</span>
                    <span className="text-muted-foreground">
                      {data.count} GD · {formatValue(data.value)} {token}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
