import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Coins, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  Filter, 
  Upload,
  Gift,
  Wallet,
  RefreshCw,
  Calendar,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigate } from "react-router-dom";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";

interface RewardTransaction {
  id: string;
  amount: number;
  reward_type: string;
  created_at: string;
  claimed: boolean;
  video_id: string | null;
  video_title?: string;
}

const REWARD_TYPE_MAP: Record<string, { icon: any; label: string; color: string }> = {
  view: { icon: Eye, label: "Xem video", color: "text-blue-500" },
  like: { icon: ThumbsUp, label: "Thích video", color: "text-pink-500" },
  comment: { icon: MessageSquare, label: "Bình luận", color: "text-green-500" },
  share: { icon: Share2, label: "Chia sẻ", color: "text-purple-500" },
  upload: { icon: Upload, label: "Upload video", color: "text-orange-500" },
  first_upload: { icon: Gift, label: "Video đầu tiên", color: "text-yellow-500" },
  signup: { icon: Gift, label: "Đăng ký tài khoản", color: "text-cyan-500" },
  wallet_connect: { icon: Wallet, label: "Kết nối ví", color: "text-emerald-500" },
};

export default function RewardHistory() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTime, setFilterTime] = useState<string>("all");
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filterType, filterTime]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("reward_transactions")
        .select(`
          id,
          amount,
          reward_type,
          created_at,
          claimed,
          video_id
        `)
        .eq("user_id", user.id)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch video titles for transactions with video_id
      const videoIds = [...new Set(data?.filter(t => t.video_id).map(t => t.video_id) || [])];
      
      let videoMap = new Map<string, string>();
      if (videoIds.length > 0) {
        const { data: videos } = await supabase
          .from("videos")
          .select("id, title")
          .in("id", videoIds);
        videoMap = new Map(videos?.map(v => [v.id, v.title]) || []);
      }

      const enrichedData = data?.map(t => ({
        ...t,
        video_title: t.video_id ? videoMap.get(t.video_id) : undefined
      })) || [];

      setTransactions(enrichedData);

      // Calculate totals
      let earned = 0;
      let unclaimed = 0;
      data?.forEach(t => {
        earned += Number(t.amount);
        if (!t.claimed) unclaimed += Number(t.amount);
      });
      setTotalEarned(earned);
      setTotalUnclaimed(unclaimed);
    } catch (error) {
      console.error("Error fetching reward history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.reward_type === filterType);
    }

    // Filter by time
    const now = new Date();
    if (filterTime === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(t => new Date(t.created_at) >= today);
    } else if (filterTime === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.created_at) >= weekAgo);
    } else if (filterTime === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.created_at) >= monthAgo);
    }

    setFilteredTransactions(filtered);
  };

  const formatNumber = (num: number) => Math.floor(num).toLocaleString('vi-VN');

  const getRewardInfo = (type: string) => {
    return REWARD_TYPE_MAP[type] || { icon: Coins, label: type, color: "text-gray-500" };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-8 h-8 text-yellow-500 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Lịch Sử Thưởng CAMLY
              </h1>
            </div>
            <p className="text-muted-foreground">
              Chi tiết các phần thưởng bạn đã nhận được
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <Coins className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-yellow-500">
                    <CounterAnimation value={totalEarned} decimals={0} />
                  </p>
                  <p className="text-xs text-muted-foreground">Tổng đã kiếm</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                <CardContent className="p-4 text-center">
                  <Gift className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-cyan-500">
                    <CounterAnimation value={totalUnclaimed} decimals={0} />
                  </p>
                  <p className="text-xs text-muted-foreground">Chờ claim</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lọc:</span>
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Loại thưởng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="view">Xem video</SelectItem>
                  <SelectItem value="like">Thích video</SelectItem>
                  <SelectItem value="comment">Bình luận</SelectItem>
                  <SelectItem value="share">Chia sẻ</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="first_upload">Video đầu tiên</SelectItem>
                  <SelectItem value="signup">Đăng ký</SelectItem>
                  <SelectItem value="wallet_connect">Kết nối ví</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTime} onValueChange={setFilterTime}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={fetchTransactions} className="ml-auto">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="w-5 h-5 text-yellow-500" />
                Giao dịch ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Coins className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Chưa có giao dịch nào</p>
                  <p className="text-sm">Xem video, like, comment để kiếm CAMLY!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredTransactions.map((tx, index) => {
                      const { icon: Icon, label, color } = getRewardInfo(tx.reward_type);
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: Math.min(index * 0.02, 0.5) }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-muted ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              {tx.video_title && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {tx.video_title}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-yellow-500">+<CounterAnimation value={tx.amount} decimals={0} showTooltip={false} /></p>
                            <Badge 
                              variant="secondary" 
                              className={tx.claimed ? "bg-green-500/20 text-green-500 text-xs" : "bg-yellow-500/20 text-yellow-500 text-xs"}
                            >
                              {tx.claimed ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Đã claim
                                </>
                              ) : "Chờ claim"}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
