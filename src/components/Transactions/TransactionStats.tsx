import { TrendingUp, Hash, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      label: "Tổng giao dịch",
      value: stats.totalCount.toLocaleString("vi-VN"),
      icon: Hash,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Tổng giá trị",
      value: formatCompactValue(stats.totalValue),
      fullValue,
      suffix: "CAMLY",
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      wide: true,
    },
    {
      label: "Hôm nay",
      value: stats.todayCount.toLocaleString("vi-VN"),
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Thành công",
      value: stats.successCount.toLocaleString("vi-VN"),
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Chờ xử lý",
      value: stats.pendingCount.toLocaleString("vi-VN"),
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-3", className)}>
        {statItems.map((item, index) => (
          <Card
            key={index}
            className={cn(
              "bg-card/50 backdrop-blur-sm border-border/50",
              item.wide && "col-span-2 md:col-span-1"
            )}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", item.bgColor)}>
                  <item.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", item.color)} />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                  {item.fullValue ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm sm:text-lg font-bold truncate cursor-default">
                          {item.value}
                          {item.suffix && (
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              {item.suffix}
                            </span>
                          )}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.fullValue} CAMLY</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <p className="text-sm sm:text-lg font-bold truncate">
                      {item.value}
                      {item.suffix && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {item.suffix}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
