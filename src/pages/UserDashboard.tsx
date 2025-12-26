import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRewardStatistics, useRewardHistory } from "@/hooks/useRewardStatistics";
import { useRewardConfig } from "@/hooks/useRewardConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Coins, Eye, MessageSquare, Upload, TrendingUp, Calendar, ExternalLink, Shield } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { PendingRewardsWidget } from "@/components/Dashboard/PendingRewardsWidget";
import { EstimatedEarningsWidget } from "@/components/Dashboard/EstimatedEarningsWidget";
import { ClaimHistoryWidget } from "@/components/Dashboard/ClaimHistoryWidget";
import { LiveRewardCounter } from "@/components/Dashboard/LiveRewardCounter";
import { ClaimRewardsModal } from "@/components/Rewards/ClaimRewardsModal";
import { RewardPolicyCard } from "@/components/Rewards/RewardPolicyCard";

const REWARD_TYPE_LABELS: Record<string, string> = {
  VIEW: "Xem video",
  LIKE: "Thích",
  COMMENT: "Bình luận",
  SHARE: "Chia sẻ",
  UPLOAD: "Tải lên",
  FIRST_UPLOAD: "Video đầu tiên",
  SIGNUP: "Đăng ký",
  WALLET_CONNECT: "Kết nối ví",
};

const REWARD_TYPE_COLORS: Record<string, string> = {
  VIEW: "#00E7FF",
  LIKE: "#FF00E5",
  COMMENT: "#7A2BFF",
  SHARE: "#FFD700",
  UPLOAD: "#00FF7F",
  FIRST_UPLOAD: "#FF6B6B",
  SIGNUP: "#4ECDC4",
  WALLET_CONNECT: "#45B7D1",
};

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { statistics, loading: statsLoading } = useRewardStatistics(user?.id);
  const { transactions, loading: historyLoading } = useRewardHistory(user?.id);
  const { configs } = useRewardConfig();
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Get limits from config or use defaults
  const getDailyLimit = (key: string, fallback: number) => {
    const config = configs.find(c => c.config_key === key);
    return config ? Number(config.config_value) : fallback;
  };

  const DAILY_LIMITS = {
    VIEW_REWARDS: getDailyLimit('DAILY_VIEW_LIMIT', 100000),
    COMMENT_REWARDS: getDailyLimit('DAILY_COMMENT_LIMIT', 50000),
    UPLOAD_COUNT: getDailyLimit('DAILY_UPLOAD_LIMIT', 10),
  };

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
              User Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Theo dõi phần thưởng CAMLY của bạn</p>
          </div>
          <LiveRewardCounter totalRewards={statistics?.totalEarned || 0} />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Pending Rewards Widget */}
          <PendingRewardsWidget 
            userId={user.id} 
            onClaimClick={() => setShowClaimModal(true)} 
          />
        </div>

        {/* Estimated Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EstimatedEarningsWidget userId={user.id} />
          <RewardPolicyCard />
        </div>

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

        {/* Anti-Fraud Notice */}
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-medium text-green-500">Hệ thống bảo vệ chống gian lận</p>
              <p className="text-sm text-muted-foreground">
                View deduplication, spam detection, và session tracking đang hoạt động để bảo vệ công bằng cho tất cả users.
              </p>
            </div>
          </CardContent>
        </Card>

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

        {/* Claim History */}
        <ClaimHistoryWidget userId={user.id} />

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
                        {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
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

      {/* Claim Modal */}
      <ClaimRewardsModal 
        open={showClaimModal} 
        onOpenChange={setShowClaimModal} 
      />
    </div>
  );
};

export default UserDashboard;
