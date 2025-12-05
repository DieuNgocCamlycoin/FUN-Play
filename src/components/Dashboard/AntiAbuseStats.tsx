import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, CheckCircle, Eye, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AntiAbuseMetrics {
  totalViewsToday: number;
  validViewsToday: number;
  invalidViewsToday: number;
  totalCommentsToday: number;
  validCommentsToday: number;
  invalidCommentsToday: number;
  usersAtDailyLimit: number;
}

export const AntiAbuseStats = () => {
  const [metrics, setMetrics] = useState<AntiAbuseMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const startOfDay = `${today}T00:00:00.000Z`;
        const endOfDay = `${today}T23:59:59.999Z`;

        // Get view logs for today
        const { data: viewLogs } = await supabase
          .from("view_logs")
          .select("is_valid")
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay);

        const totalViewsToday = viewLogs?.length || 0;
        const validViewsToday = viewLogs?.filter((v) => v.is_valid).length || 0;
        const invalidViewsToday = totalViewsToday - validViewsToday;

        // Get comment logs for today
        const { data: commentLogs } = await supabase
          .from("comment_logs")
          .select("is_valid")
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay);

        const totalCommentsToday = commentLogs?.length || 0;
        const validCommentsToday = commentLogs?.filter((c) => c.is_valid).length || 0;
        const invalidCommentsToday = totalCommentsToday - validCommentsToday;

        // Get users who hit daily limits
        const { data: dailyLimits } = await supabase
          .from("daily_reward_limits")
          .select("*")
          .eq("date", today);

        const usersAtDailyLimit = dailyLimits?.filter(
          (l) =>
            Number(l.view_rewards_earned) >= 50000 ||
            Number(l.comment_rewards_earned) >= 25000
        ).length || 0;

        setMetrics({
          totalViewsToday,
          validViewsToday,
          invalidViewsToday,
          totalCommentsToday,
          validCommentsToday,
          invalidCommentsToday,
          usersAtDailyLimit,
        });
      } catch (error) {
        console.error("Error fetching anti-abuse metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Anti-Abuse Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const viewValidityRate = metrics.totalViewsToday > 0
    ? (metrics.validViewsToday / metrics.totalViewsToday) * 100
    : 100;

  const commentValidityRate = metrics.totalCommentsToday > 0
    ? (metrics.validCommentsToday / metrics.totalCommentsToday) * 100
    : 100;

  return (
    <Card className="border-2 border-[#00E7FF]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00E7FF]" />
          Anti-Abuse Statistics (Today)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* View Validation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#7A2BFF]" />
              <span className="font-medium">View Validation</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {metrics.validViewsToday.toLocaleString()} / {metrics.totalViewsToday.toLocaleString()} valid
            </span>
          </div>
          <Progress value={viewValidityRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {viewValidityRate.toFixed(1)}% valid
            </span>
            {metrics.invalidViewsToday > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertTriangle className="w-3 h-3" />
                {metrics.invalidViewsToday} rejected
              </span>
            )}
          </div>
        </div>

        {/* Comment Validation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FF00E5]" />
              <span className="font-medium">Comment Validation</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {metrics.validCommentsToday.toLocaleString()} / {metrics.totalCommentsToday.toLocaleString()} valid
            </span>
          </div>
          <Progress value={commentValidityRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {commentValidityRate.toFixed(1)}% valid
            </span>
            {metrics.invalidCommentsToday > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertTriangle className="w-3 h-3" />
                {metrics.invalidCommentsToday} rejected
              </span>
            )}
          </div>
        </div>

        {/* Daily Limit Alert */}
        {metrics.usersAtDailyLimit > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <div className="font-medium text-amber-500">
                  {metrics.usersAtDailyLimit} user(s) hit daily limit
                </div>
                <div className="text-xs text-muted-foreground">
                  These users have reached their maximum daily rewards
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {metrics.validViewsToday + metrics.validCommentsToday}
            </div>
            <div className="text-xs text-muted-foreground">Valid Actions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">
              {metrics.invalidViewsToday + metrics.invalidCommentsToday}
            </div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00E7FF]">
              {metrics.usersAtDailyLimit}
            </div>
            <div className="text-xs text-muted-foreground">At Limit</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
