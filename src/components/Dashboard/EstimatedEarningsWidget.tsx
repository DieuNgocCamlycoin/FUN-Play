import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { useEstimatedEarnings } from "@/hooks/useClaimHistory";

interface EstimatedEarningsWidgetProps {
  userId: string;
}

export const EstimatedEarningsWidget = ({ userId }: EstimatedEarningsWidgetProps) => {
  const { estimate, loading } = useEstimatedEarnings(userId);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 h-40" />
      </Card>
    );
  }

  const estimateItems = [
    {
      label: "Hàng ngày",
      value: estimate?.daily || 0,
      icon: Calendar,
      color: "#00E7FF",
    },
    {
      label: "Hàng tuần",
      value: estimate?.weekly || 0,
      icon: CalendarDays,
      color: "#7A2BFF",
    },
    {
      label: "Hàng tháng",
      value: estimate?.monthly || 0,
      icon: CalendarRange,
      color: "#FF00E5",
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-[#00E7FF]/5 via-[#7A2BFF]/5 to-[#FF00E5]/5 border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00E7FF]" />
          Ước tính thu nhập
          <span className="text-xs font-normal text-muted-foreground">(dựa trên 7 ngày gần đây)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {estimateItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <item.icon 
                className="w-5 h-5 mx-auto mb-2" 
                style={{ color: item.color }}
              />
              <div 
                className="text-xl font-bold"
                style={{ color: item.color }}
              >
                {item.value.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          💡 Xem video, comment và upload để tăng thu nhập CAMLY!
        </p>
      </CardContent>
    </Card>
  );
};
