import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PeriodStats {
  current: number;
  previous: number;
  change: number;
}

interface WeeklyMonthlyStatsProps {
  userId: string;
}

export const WeeklyMonthlyStats = ({ userId }: WeeklyMonthlyStatsProps) => {
  const [weeklyStats, setWeeklyStats] = useState<PeriodStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        
        // Weekly calculations
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);
        
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        // Monthly calculations
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Fetch this week's rewards
        const { data: thisWeekData } = await supabase
          .from("reward_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", startOfThisWeek.toISOString());

        const thisWeekTotal = thisWeekData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        // Fetch last week's rewards
        const { data: lastWeekData } = await supabase
          .from("reward_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", startOfLastWeek.toISOString())
          .lt("created_at", startOfThisWeek.toISOString());

        const lastWeekTotal = lastWeekData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        // Fetch this month's rewards
        const { data: thisMonthData } = await supabase
          .from("reward_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", startOfThisMonth.toISOString());

        const thisMonthTotal = thisMonthData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        // Fetch last month's rewards
        const { data: lastMonthData } = await supabase
          .from("reward_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", startOfLastMonth.toISOString())
          .lte("created_at", endOfLastMonth.toISOString());

        const lastMonthTotal = lastMonthData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        // Calculate percentage changes
        const weeklyChange = lastWeekTotal > 0 
          ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 
          : thisWeekTotal > 0 ? 100 : 0;

        const monthlyChange = lastMonthTotal > 0 
          ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
          : thisMonthTotal > 0 ? 100 : 0;

        setWeeklyStats({
          current: thisWeekTotal,
          previous: lastWeekTotal,
          change: weeklyChange,
        });

        setMonthlyStats({
          current: thisMonthTotal,
          previous: lastMonthTotal,
          change: monthlyChange,
        });
      } catch (error) {
        console.error("Error fetching period stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const renderTrend = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <TrendingUp className="w-4 h-4" />
          <span>+{change.toFixed(1)}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <TrendingDown className="w-4 h-4" />
          <span>{change.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span>0%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Period Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">This Week</div>
                <div className="text-2xl font-bold text-[#FFD700]">
                  {weeklyStats?.current.toLocaleString()} CAMLY
                </div>
                {weeklyStats && renderTrend(weeklyStats.change)}
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">Last Week</div>
                <div className="text-2xl font-bold">
                  {weeklyStats?.previous.toLocaleString()} CAMLY
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">This Month</div>
                <div className="text-2xl font-bold text-[#FFD700]">
                  {monthlyStats?.current.toLocaleString()} CAMLY
                </div>
                {monthlyStats && renderTrend(monthlyStats.change)}
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">Last Month</div>
                <div className="text-2xl font-bold">
                  {monthlyStats?.previous.toLocaleString()} CAMLY
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
