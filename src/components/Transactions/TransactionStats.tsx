import { TrendingUp, Hash, Calendar, CheckCircle2, Clock } from "lucide-react";
import { TransactionStats as StatsType } from "@/hooks/useTransactionHistory";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatCompactValue = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("vi-VN");
};

interface TransactionStatsProps {
  stats: StatsType;
  className?: string;
}

export function TransactionStats({ stats, className }: TransactionStatsProps) {
  const fullValue = stats.totalValue.toLocaleString("vi-VN");

  const statItems = [
    {
      label: "Tổng giao",
      value: stats.totalCount.toLocaleString("vi-VN"),
      icon: Hash,
      color: "text-blue-500",
    },
    {
      label: "Tổng giá trị",
      value: formatCompactValue(stats.totalValue),
      fullValue,
      suffix: "CAMLY",
      icon: TrendingUp,
      color: "text-amber-500",
    },
    {
      label: "Hôm nay",
      value: stats.todayCount.toLocaleString("vi-VN"),
      icon: Calendar,
      color: "text-purple-500",
    },
    {
      label: "Thành công",
      value: stats.successCount.toLocaleString("vi-VN"),
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "Xử lý",
      value: stats.pendingCount.toLocaleString("vi-VN"),
      icon: Clock,
      color: "text-orange-500",
    },
  ];

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-3", className)}>
        {statItems.map((item, index) => (
          <div
            key={index}
            className="bg-background border border-border rounded-xl p-3"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <item.icon className={cn("h-3.5 w-3.5", item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            {item.fullValue ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xl font-bold truncate cursor-default">
                    {item.value}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {item.suffix}
                    </span>
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.fullValue} CAMLY</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-xl font-bold truncate">{item.value}</p>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
