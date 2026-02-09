import { TrendingUp, Hash, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionStats as StatsType } from "@/hooks/useTransactionHistory";
import { cn } from "@/lib/utils";

interface TransactionStatsProps {
  stats: StatsType;
  className?: string;
}

export function TransactionStats({ stats, className }: TransactionStatsProps) {
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
      value: stats.totalValue.toLocaleString("vi-VN"),
      suffix: "CAMLY",
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
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
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-3", className)}>
      {statItems.map((item, index) => (
        <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", item.bgColor)}>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">
                  {item.value}
                  {item.suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{item.suffix}</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
