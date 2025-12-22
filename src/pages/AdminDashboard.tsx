import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatistics } from "@/hooks/useAdminStatistics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { Users, Video, Eye, MessageSquare, Coins, TrendingUp, Crown, Award, Activity, ShieldX, CloudUpload, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { Navigate, useNavigate } from "react-router-dom";
import VideoMigrationPanel from "@/components/Admin/VideoMigrationPanel";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { platformStats, topCreators, topEarners, dailyStats, loading } = useAdminStatistics();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(data === true);
      setCheckingRole(false);
    };
    checkAdminRole();
  }, [user]);

  if (authLoading || loading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShieldX className="w-16 h-16 mx-auto text-destructive mb-4" />
          <p className="text-lg font-semibold">Truy cập bị từ chối</p>
          <p className="text-muted-foreground mt-2">Bạn không có quyền truy cập trang này</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Thống kê toàn nền tảng FUN Play</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/video-stats')} 
            className="gap-2 bg-gradient-to-r from-[#7A2BFF] to-[#FF00E5] hover:opacity-90"
          >
            <BarChart3 className="w-4 h-4" />
            Thống Kê Video Uploads
          </Button>
        </div>

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

        {/* Charts */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Hoạt động</TabsTrigger>
            <TabsTrigger value="rewards">Phần thưởng</TabsTrigger>
            <TabsTrigger value="engagement">Tương tác</TabsTrigger>
            <TabsTrigger value="migration" className="flex items-center gap-1">
              <CloudUpload className="w-4 h-4" />
              Migration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Người dùng hoạt động hàng ngày (30 ngày)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), "dd/MM")}
                      />
                      <YAxis />
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
          </TabsContent>

          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#FFD700]" />
                  CAMLY phân phối hàng ngày (30 ngày)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), "dd/MM")}
                      />
                      <YAxis />
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
          </TabsContent>

          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Lượt xem & Bình luận hàng ngày (30 ngày)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), "dd/MM")}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => format(new Date(date), "dd/MM/yyyy")}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#FF00E5" 
                        strokeWidth={2}
                        name="Lượt xem"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="comments" 
                        stroke="#00FF7F" 
                        strokeWidth={2}
                        name="Bình luận"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migration">
            <VideoMigrationPanel />
          </TabsContent>
        </Tabs>

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
                      <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{creator.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {creator.videoCount} videos • {creator.totalViews.toLocaleString()} views
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[#FFD700] border-[#FFD700]">
                      {creator.totalRewards.toLocaleString()} CAMLY
                    </Badge>
                  </div>
                ))}
                {topCreators.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
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
                      <AvatarFallback>{earner.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{earner.displayName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#FFD700]">
                        {earner.totalEarned.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">CAMLY</div>
                    </div>
                  </div>
                ))}
                {topEarners.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reward Rules Info */}
        <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
          <CardHeader>
            <CardTitle>Quy tắc phần thưởng CAMLY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="font-bold text-[#00E7FF] mb-2">Creator Rewards</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Upload video: 50,000 CAMLY</li>
                  <li>• Giới hạn: 10 uploads/ngày</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="font-bold text-[#7A2BFF] mb-2">Viewer Rewards</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Mỗi 10 lượt xem hợp lệ: 5,000 CAMLY</li>
                  <li>• Xem hợp lệ: ≥30s hoặc ≥30% video</li>
                  <li>• Giới hạn: 50,000 CAMLY/ngày</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <h4 className="font-bold text-[#FF00E5] mb-2">Comment Rewards</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Mỗi bình luận hợp lệ: 5,000 CAMLY</li>
                  <li>• Bình luận hợp lệ: ≥5 ký tự</li>
                  <li>• Giới hạn: 5 comments/video/ngày</li>
                  <li>• Tổng giới hạn: 25,000 CAMLY/ngày</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
