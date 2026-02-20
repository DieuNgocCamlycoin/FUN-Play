import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Wallet, Users } from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { motion } from "framer-motion";

interface RewardStatsProps {
  userId: string;
  walletAddress?: string | null;
}

export const RewardStats = ({ userId, walletAddress }: RewardStatsProps) => {
  const [totalRewards, setTotalRewards] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewardStats();
  }, [userId]);

  const fetchRewardStats = async () => {
    try {
      // Single Source of Truth: RPC + channel query in parallel
      const [summaryResult, channelResult] = await Promise.all([
        supabase.rpc('get_user_activity_summary', { p_user_id: userId }),
        supabase.from("channels").select("subscriber_count").eq("user_id", userId).single(),
      ]);

      const summary = summaryResult.data as any;
      if (summary) {
        setTotalRewards(Number(summary.total_camly || 0));
        setCurrentBalance(Number(summary.claimable_balance || 0));
      }

      if (channelResult.data) {
        setSubscriberCount(channelResult.data.subscriber_count || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching reward stats:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-20" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Coins,
      label: "Tổng Reward",
      labelEn: "Total Rewards",
      value: totalRewards,
      color: "from-yellow-400 to-amber-400",
      suffix: " CAMLY",
    },
    {
      icon: Wallet,
      label: "Số dư CAMLY",
      labelEn: "CAMLY Balance",
      value: currentBalance,
      color: "from-green-400 to-emerald-400",
      suffix: " CAMLY",
    },
    {
      icon: Users,
      label: "Người theo dõi",
      labelEn: "Subscribers",
      value: subscriberCount,
      color: "from-blue-400 to-cyan-400",
      suffix: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.labelEn}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-xl border-2 border-cyan-400/50 p-4 hover:border-cyan-400/70 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,231,255,0.5)]">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground/70 font-medium mb-1">
                    {stat.label}
                  </div>
                  <div className={`text-xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent tabular-nums`}>
                    <CounterAnimation value={stat.value} decimals={0} />
                    {stat.suffix}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
      );
      })}
    </div>
  );
};
