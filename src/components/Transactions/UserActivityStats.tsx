import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, ThumbsUp, MessageSquare, Share2, Upload, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/useDebounce";

interface ActivityData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  uploads: number;
  totalCamly: number;
}

export function UserActivityStats({ className }: { className?: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ActivityData>({
    views: 0, likes: 0, comments: 0, shares: 0, uploads: 0, totalCamly: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: summary, error } = await supabase.rpc("get_user_activity_summary", {
        p_user_id: user.id,
      });
      if (error) throw error;
      if (summary && Array.isArray(summary)) {
        const stats: ActivityData = { views: 0, likes: 0, comments: 0, shares: 0, uploads: 0, totalCamly: 0 };
        summary.forEach((row: any) => {
          const type = (row.reward_type || "").toUpperCase();
          const count = Number(row.total_count) || 0;
          const amount = Number(row.total_amount) || 0;
          stats.totalCamly += amount;
          switch (type) {
            case "VIEW": stats.views = count; break;
            case "LIKE": stats.likes = count; break;
            case "COMMENT": stats.comments = count; break;
            case "SHARE": stats.shares = count; break;
            case "UPLOAD":
            case "SHORT_VIDEO_UPLOAD":
            case "LONG_VIDEO_UPLOAD":
              stats.uploads += count; break;
          }
        });
        setData(stats);
      }
    } catch (err) {
      console.error("Error fetching activity stats:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const debouncedFetch = useDebouncedCallback(fetchStats, 500);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime listener
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("activity-stats-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reward_transactions",
        filter: `user_id=eq.${user.id}`,
      }, () => debouncedFetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, debouncedFetch]);

  if (!user) return null;

  const items = [
    { icon: Eye, label: "Lượt xem", value: data.views, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: ThumbsUp, label: "Lượt thích", value: data.likes, color: "text-pink-500", bg: "bg-pink-500/10" },
    { icon: MessageSquare, label: "Bình luận", value: data.comments, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Share2, label: "Chia sẻ", value: data.shares, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Upload, label: "Upload", value: data.uploads, color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: Award, label: "Tổng CAMLY", value: data.totalCamly, color: "text-amber-500", bg: "bg-amber-500/10", isCamly: true },
  ];

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Thống kê hoạt động của bạn</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30"
            >
              <div className={cn("p-1.5 rounded-md", item.bg)}>
                <item.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", item.color)} />
              </div>
              <span className="text-sm sm:text-base font-bold">
                {loading ? "—" : item.isCamly
                  ? data.totalCamly >= 1_000_000
                    ? `${(data.totalCamly / 1_000_000).toFixed(1)}M`
                    : data.totalCamly >= 1_000
                      ? `${(data.totalCamly / 1_000).toFixed(1)}K`
                      : data.totalCamly.toLocaleString("vi-VN")
                  : item.value.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight text-center">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
