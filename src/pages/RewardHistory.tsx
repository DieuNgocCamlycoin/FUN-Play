import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Eye, ThumbsUp, MessageSquare, Share2, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RewardTransaction {
  id: string;
  amount: number;
  token_type: string;
  tx_hash: string;
  created_at: string;
  video_id: string | null;
}

const REWARD_TYPE_MAP: Record<string, { icon: any; label: string; color: string }> = {
  VIEW: { icon: Eye, label: "Xem video", color: "text-cyan-400" },
  LIKE: { icon: ThumbsUp, label: "Thích video", color: "text-pink-400" },
  COMMENT: { icon: MessageSquare, label: "Bình luận", color: "text-purple-400" },
  SHARE: { icon: Share2, label: "Chia sẻ", color: "text-green-400" },
};

export default function RewardHistory() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterTime, setFilterTime] = useState<string>("ALL");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filterType, filterTime]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("wallet_transactions")
        .select("*")
        .eq("to_user_id", user.id)
        .eq("from_address", "SYSTEM_REWARD")
        .order("created_at", { ascending: false });

      // Apply type filter
      if (filterType !== "ALL") {
        query = query.ilike("tx_hash", `%${filterType}%`);
      }

      // Apply time filter
      if (filterTime !== "ALL") {
        const now = new Date();
        let startDate = new Date();
        
        if (filterTime === "TODAY") {
          startDate.setHours(0, 0, 0, 0);
        } else if (filterTime === "WEEK") {
          startDate.setDate(now.getDate() - 7);
        } else if (filterTime === "MONTH") {
          startDate.setMonth(now.getMonth() - 1);
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching reward history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRewardType = (txHash: string) => {
    if (txHash.includes("VIEW")) return "VIEW";
    if (txHash.includes("LIKE")) return "LIKE";
    if (txHash.includes("COMMENT")) return "COMMENT";
    if (txHash.includes("SHARE")) return "SHARE";
    return "VIEW";
  };

  const totalRewards = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Đang tải lịch sử phần thưởng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-10 h-10 text-yellow-400 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Lịch Sử Phần Thưởng
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Theo dõi toàn bộ CAMLY bạn đã nhận được
            </p>
          </motion.div>

          {/* Total Rewards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-yellow-500/60 rounded-xl p-6 mb-6 shadow-[0_0_30px_rgba(255,215,0,0.4)]"
          >
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Tổng CAMLY đã nhận</div>
              <div className="text-5xl font-bold text-yellow-400">
                {totalRewards.toFixed(3)}
                <span className="text-2xl ml-2">CAMLY</span>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] bg-[#2a2a2a] border-gray-600">
                  <SelectValue placeholder="Loại hoạt động" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="VIEW">Xem video</SelectItem>
                  <SelectItem value="LIKE">Thích</SelectItem>
                  <SelectItem value="COMMENT">Bình luận</SelectItem>
                  <SelectItem value="SHARE">Chia sẻ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterTime} onValueChange={setFilterTime}>
              <SelectTrigger className="w-[180px] bg-[#2a2a2a] border-gray-600">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-600">
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="TODAY">Hôm nay</SelectItem>
                <SelectItem value="WEEK">7 ngày qua</SelectItem>
                <SelectItem value="MONTH">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {transactions.map((tx, index) => {
              const rewardType = getRewardType(tx.tx_hash);
              const typeInfo = REWARD_TYPE_MAP[rewardType];
              const Icon = typeInfo.icon;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border border-gray-600/40 rounded-lg p-4 hover:border-gray-500/60 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full bg-gray-800/50 ${typeInfo.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{typeInfo.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm", { locale: vi })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-400">
                        +{Number(tx.amount).toFixed(3)}
                      </div>
                      <div className="text-xs text-yellow-500">CAMLY</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {transactions.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Chưa có giao dịch phần thưởng nào
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
