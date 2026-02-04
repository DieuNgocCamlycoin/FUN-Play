import { useAdminStatistics } from "@/hooks/useAdminStatistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area 
} from "recharts";
import { 
  Users, Video, Eye, MessageSquare, Coins, Activity, 
  Crown, Award, TrendingUp 
} from "lucide-react";
import { format } from "date-fns";

export function OverviewTab() {
  const { platformStats, topCreators, topEarners, dailyStats, loading } = useAdminStatistics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-[#00E7FF]/10 to-[#00E7FF]/5 border-[#00E7FF]/30">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-[#00E7FF] mb-2" />
            <div className="text-2xl font-bold">{(platformStats?.totalUsers || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tổng người dùng</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#7A2BFF]/10 to-[#7A2BFF]/5 border-[#7A2BFF]/30">
          <CardContent className="p-4 text-center">
            <Video className="w-8 h-8 mx-auto text-[#7A2BFF] mb-2" />
            <div className="text-2xl font-bold">{(platformStats?.totalVideos || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tổng video</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FF00E5]/10 to-[#FF00E5]/5 border-[#FF00E5]/30">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto text-[#FF00E5] mb-2" />
            <div className="text-2xl font-bold">{(platformStats?.totalViews || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tổng lượt xem</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#00FF7F]/10 to-[#00FF7F]/5 border-[#00FF7F]/30">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-[#00FF7F] mb-2" />
            <div className="text-2xl font-bold">{(platformStats?.totalComments || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tổng bình luận</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FFD700]/10 to-[#FFD700]/5 border-[#FFD700]/30">
          <CardContent className="p-4 text-center">
            <Coins className="w-8 h-8 mx-auto text-[#FFD700] mb-2" />
            <div className="text-2xl font-bold">{(platformStats?.totalRewardsDistributed || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tổng CAMLY phát</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FF6B6B]/10 to-[#FF6B6B]/5 border-[#FF6B6B]/30">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto text-[#FF6B6B] mb-2" />
            <div className="text-2xl font-bold">{(platformStats?.activeUsersToday || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Hoạt động hôm nay</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Người dùng hoạt động (30 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), "dd/MM")}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy")}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="#00E7FF" 
                    fill="#00E7FF"
                    fillOpacity={0.3}
                    name="Người dùng"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="w-5 h-5 text-[#FFD700]" />
              CAMLY phân phối (30 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), "dd/MM")}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy")}
                    formatter={(value: number) => value.toLocaleString() + ' CAMLY'}
                  />
                  <Bar 
                    dataKey="rewardsDistributed" 
                    fill="#FFD700" 
                    name="CAMLY"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#FFD700]" />
              Top 10 Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCreators.map((creator, index) => (
                <div 
                  key={creator.userId}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FF9500] text-black font-bold text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={creator.avatarUrl || undefined} />
                    <AvatarFallback>{creator.displayName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{creator.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {creator.videoCount} videos • {creator.totalViews.toLocaleString()} views
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {creator.totalRewards.toLocaleString()} CAMLY
                  </Badge>
                </div>
              ))}
              {topCreators.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Earners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00E7FF]" />
              Top 10 Earners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEarners.map((earner, index) => (
                <div 
                  key={earner.userId}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#00E7FF] to-[#7A2BFF] text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={earner.avatarUrl || undefined} />
                    <AvatarFallback>{earner.displayName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{earner.displayName}</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FF9500] text-black">
                    {earner.totalEarned.toLocaleString()} CAMLY
                  </Badge>
                </div>
              ))}
              {topEarners.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
