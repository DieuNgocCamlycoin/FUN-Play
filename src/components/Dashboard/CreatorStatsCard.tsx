import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Eye, Heart, MessageSquare, TrendingUp, Calendar } from "lucide-react";
import { useCreatorRewards } from "@/hooks/useCreatorRewards";

interface CreatorStatsCardProps {
  userId: string;
}

export const CreatorStatsCard = ({ userId }: CreatorStatsCardProps) => {
  const { stats, loading } = useCreatorRewards(userId);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="text-lg">Creator Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    { icon: Video, label: "Total Videos", value: stats.totalVideos, color: "#00E7FF" },
    { icon: Eye, label: "Total Views", value: stats.totalViews.toLocaleString(), color: "#7A2BFF" },
    { icon: Heart, label: "Total Likes", value: stats.totalLikes.toLocaleString(), color: "#FF00E5" },
    { icon: MessageSquare, label: "Total Comments", value: stats.totalComments.toLocaleString(), color: "#FFD700" },
  ];

  return (
    <Card className="bg-gradient-to-br from-[#00E7FF]/5 via-[#7A2BFF]/5 to-[#FF00E5]/5 border border-[#FFD700]/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00E7FF]" />
          Creator Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-lg bg-background/50 border border-border/50"
            >
              <item.icon className="w-5 h-5 mb-2" style={{ color: item.color }} />
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#FFD700]/20 to-[#FF9500]/20 border border-[#FFD700]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#FFD700]/20">
              <Calendar className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <div className="font-medium">This Month</div>
              <div className="text-sm text-muted-foreground">
                {stats.videosThisMonth} videos • {stats.viewsThisMonth.toLocaleString()} views
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#FFD700]">
              {stats.totalEarnedAsCreator.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">CAMLY earned as creator</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
