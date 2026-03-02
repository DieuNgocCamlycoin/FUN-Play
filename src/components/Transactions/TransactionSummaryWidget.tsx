import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash, TrendingUp, Trophy, BarChart3 } from "lucide-react";
import type { UnifiedTransaction } from "@/hooks/useTransactionHistory";
import { cn } from "@/lib/utils";

type Direction = "both" | "sent" | "received";
type TokenFilter = "all" | "CAMLY" | "USDT" | "BNB" | "FUN";
type TimeFilter = "today" | "7d" | "30d" | "all";

interface Props {
  transactions: UnifiedTransaction[];
  currentUserId?: string;
}

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "both", label: "Tất cả" },
  { value: "sent", label: "Đã gửi" },
  { value: "received", label: "Đã nhận" },
];

const TOKEN_OPTIONS: TokenFilter[] = ["all", "CAMLY", "USDT", "BNB", "FUN"];
const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "all", label: "Tất cả" },
];

const TOKEN_COLORS: Record<string, string> = {
  CAMLY: "bg-cyan-400",
  USDT: "bg-emerald-400",
  BNB: "bg-yellow-400",
  FUN: "bg-fuchsia-400",
};

export const TransactionSummaryWidget = ({ transactions, currentUserId }: Props) => {
  const [direction, setDirection] = useState<Direction>("both");
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const summary = useMemo(() => {
    let filtered = [...transactions];

    if (direction === "sent" && currentUserId) {
      filtered = filtered.filter(t => t.sender_user_id === currentUserId);
    } else if (direction === "received" && currentUserId) {
      filtered = filtered.filter(t => t.receiver_user_id === currentUserId);
    }

    if (tokenFilter !== "all") {
      filtered = filtered.filter(t => t.token_symbol === tokenFilter);
    }

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
      <CardContent className="p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Tổng hợp Giao dịch</h3>
        </div>

        {/* Direction + Time filters row */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center rounded-lg bg-muted/60 overflow-hidden">
            <span className="px-2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">Loại GD</span>
            <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
              <SelectTrigger className="flex-1 h-7 text-xs bg-transparent border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIRECTION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex items-center rounded-lg bg-muted/60 overflow-hidden">
            <span className="px-2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">Thời gian</span>
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="flex-1 h-7 text-xs bg-transparent border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Token filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {TOKEN_OPTIONS.map(tok => (
            <button
              key={tok}
              onClick={() => setTokenFilter(tok)}
              className={cn(
                "h-6 px-3 rounded-full text-[11px] font-medium transition-all",
                tokenFilter === tok
                  ? "bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {tok === "all" ? "Tất cả" : tok}
            </button>
          ))}
        </div>


        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-gradient-to-br from-background/90 to-muted/30 rounded-xl p-2.5 text-center">
            <Hash className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-base font-bold text-foreground">{summary.totalCount}</p>
            <p className="text-[10px] text-muted-foreground">Tổng GD</p>
          </div>
          <div className="bg-gradient-to-br from-background/90 to-muted/30 rounded-xl p-2.5 text-center">
            <TrendingUp className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-base font-bold text-foreground">
              {formatValue(summary.totalValue)}
              <span className="text-[10px] font-medium text-muted-foreground ml-0.5">{tokenFilter !== "all" ? tokenFilter : "tokens"}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Tổng giá trị</p>
          </div>
          <div className="bg-gradient-to-br from-background/90 to-muted/30 rounded-xl p-2.5 text-center">
            <Trophy className="h-3.5 w-3.5 mx-auto mb-0.5 text-primary" />
            <p className="text-base font-bold text-foreground">
              {summary.largest ? (
                <>
                  {formatValue(summary.largest.amount)}
                  <span className="text-[10px] font-medium text-muted-foreground ml-0.5">{summary.largest.token_symbol}</span>
                </>
              ) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">GD lớn nhất</p>
          </div>
        </div>

        {/* Token breakdown */}
        {tokenFilter === "all" && Object.keys(summary.breakdown).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Phân loại theo token</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(summary.breakdown)
                .sort((a, b) => b[1].value - a[1].value)
                .map(([token, data]) => (
                  <div key={token} className="flex items-center gap-1.5 bg-gradient-to-br from-background/80 to-muted/20 rounded-lg px-2 py-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", TOKEN_COLORS[token] || "bg-primary")} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold text-foreground truncate">{token}</span>
                      <span className="text-[10px] text-muted-foreground">{data.count} GD · {formatValue(data.value)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
