import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRewardStatistics, useRewardHistory } from "@/hooks/useRewardStatistics";
import { DAILY_LIMITS } from "@/lib/enhancedRewards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Coins, Eye, MessageSquare, Share2, Upload, TrendingUp, Calendar, ExternalLink, Wallet, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { CreatorStatsCard } from "@/components/Dashboard/CreatorStatsCard";
import { OnChainBalanceCard } from "@/components/Dashboard/OnChainBalanceCard";
import { WeeklyMonthlyStats } from "@/components/Dashboard/WeeklyMonthlyStats";
import { CAMLYTokenInfo } from "@/components/Dashboard/CAMLYTokenInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { exportRewardsToPDF } from "@/lib/transactionExport";

const REWARD_TYPE_LABELS: Record<string, string> = {
  VIEW: "Xem video",
  LIKE: "Thích",
  COMMENT: "Bình luận",
  SHARE: "Chia sẻ",
  UPLOAD: "Tải lên",
};

const REWARD_TYPE_COLORS: Record<string, string> = {
  VIEW: "#00E7FF",
  LIKE: "#FF00E5",
  COMMENT: "#7A2BFF",
  SHARE: "#FFD700",
  UPLOAD: "#00FF7F",
};

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { statistics, loading: statsLoading } = useRewardStatistics(user?.id);
  const { transactions, loading: historyLoading } = useRewardHistory(user?.id);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch wallet address from profile
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setWalletAddress(data?.wallet_address || null);
        });
    }
  }, [user]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <p className="text-lg">Vui lòng đăng nhập để xem dashboard</p>
        </Card>
      </div>
    );
  }

  const pieData = statistics?.breakdown.map((item) => ({
    name: REWARD_TYPE_LABELS[item.type] || item.type,
    value: item.total,
    color: REWARD_TYPE_COLORS[item.type] || "#888",
  })) || [];

  const chartData = statistics?.dailyRewards.map((item) => ({
    date: format(new Date(item.date), "dd/MM"),
    amount: item.amount,
  })) || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
              User Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Theo dõi phần thưởng CAMLY của bạn</p>
          </div>
          <div className="w-20" />
        </div>

        {/* Total Earned Card */}
        <Card className="bg-gradient-to-br from-[#00E7FF]/10 via-[#7A2BFF]/10 to-[#FF00E5]/10 border-2 border-[#FFD700]/30">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Coins className="w-10 h-10 text-[#FFD700]" />
              <span className="text-lg text-muted-foreground">Tổng CAMLY đã kiếm được</span>
            </div>
            <div className="text-6xl font-black bg-gradient-to-r from-[#FFD700] to-[#FF9500] bg-clip-text text-transparent">
              {(statistics?.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm text-muted-foreground mt-2">CAMLY Tokens</p>
          </CardContent>
        </Card>

        {/* On-Chain Wallet Balance */}
        <OnChainBalanceCard walletAddress={walletAddress} />

        {/* Creator Stats */}
        {user && <CreatorStatsCard userId={user.id} />}

        {/* Weekly/Monthly Stats */}
        {user && <WeeklyMonthlyStats userId={user.id} />}

        {/* CAMLY Token Info */}
        <CAMLYTokenInfo />

        {/* Daily Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00E7FF]" />
                Giới hạn xem hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statistics?.todayLimits.viewRewardsEarned || 0).toLocaleString()} / {DAILY_LIMITS.VIEW_REWARDS.toLocaleString()}
              </div>
              <Progress 
                value={(statistics?.todayLimits.viewRewardsEarned || 0) / DAILY_LIMITS.VIEW_REWARDS * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">CAMLY từ xem video</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#7A2BFF]" />
                Giới hạn bình luận hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(statistics?.todayLimits.commentRewardsEarned || 0).toLocaleString()} / {DAILY_LIMITS.COMMENT_REWARDS.toLocaleString()}
              </div>
              <Progress 
                value={(statistics?.todayLimits.commentRewardsEarned || 0) / DAILY_LIMITS.COMMENT_REWARDS * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">CAMLY từ bình luận</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00FF7F]" />
                Giới hạn upload hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.todayLimits.uploadCount || 0} / {DAILY_LIMITS.UPLOAD_COUNT}
              </div>
              <Progress 
                value={(statistics?.todayLimits.uploadCount || 0) / DAILY_LIMITS.UPLOAD_COUNT * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Videos đã tải lên</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="breakdown">Phân tích theo loại</TabsTrigger>
            <TabsTrigger value="timeline">Biểu đồ theo thời gian</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Phân tích phần thưởng theo loại hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => value.toLocaleString() + ' CAMLY'}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {statistics?.breakdown.map((item) => (
                      <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: REWARD_TYPE_COLORS[item.type] }}
                          />
                          <span className="font-medium">{REWARD_TYPE_LABELS[item.type] || item.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{item.total.toLocaleString()} CAMLY</div>
                          <div className="text-xs text-muted-foreground">{item.count} lần</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Phần thưởng 30 ngày gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => value.toLocaleString() + ' CAMLY'}
                        labelFormatter={(label) => `Ngày: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#FFD700" 
                        strokeWidth={3}
                        dot={{ fill: '#FFD700', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch phần thưởng</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có giao dịch nào
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: REWARD_TYPE_COLORS[tx.reward_type],
                          color: REWARD_TYPE_COLORS[tx.reward_type]
                        }}
                      >
                        {REWARD_TYPE_LABELS[tx.reward_type] || tx.reward_type}
                      </Badge>
                      <div>
                        <div className="font-medium">
                          +{Number(tx.amount).toLocaleString()} CAMLY
                        </div>
                        {tx.videos?.title && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {tx.videos.title}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}
                      </div>
                      {tx.tx_hash && (
                        <a 
                          href={`https://bscscan.com/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#00E7FF] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          BscScan
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
