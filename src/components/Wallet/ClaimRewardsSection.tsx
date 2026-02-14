import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, CheckCircle, Clock, Wallet, Trophy, Info, Hourglass } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClaimRewardsModal } from "@/components/Rewards/ClaimRewardsModal";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { AdminQuickApprove } from "@/components/Wallet/AdminQuickApprove";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CLAIM_THRESHOLD = 200000;

export const ClaimRewardsSection = () => {
  const { user } = useAuth();
  const { isConnected, address, connectWithRetry, isConnecting } = useWalletConnectionWithRetry();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const DAILY_CLAIM_LIMIT = 500000;
  const [stats, setStats] = useState({
    totalRewards: 0,
    pendingRewards: 0,
    approvedRewards: 0,
    claimedTotal: 0,
    dailyClaimed: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_camly_rewards, pending_rewards, approved_reward")
        .eq("id", user.id)
        .single();

      // Fetch total claimed
      const { data: claims } = await supabase
        .from("claim_requests")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "success");

      const claimedTotal = claims?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Fetch today's daily claimed amount
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyRecord } = await supabase
        .from("daily_claim_records")
        .select("total_claimed")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      const dailyClaimed = Number(dailyRecord?.total_claimed || 0);

      if (profile && isMountedRef.current) {
        setStats({
          totalRewards: profile.total_camly_rewards || 0,
          pendingRewards: profile.pending_rewards || 0,
          approvedRewards: profile.approved_reward || 0,
          claimedTotal,
          dailyClaimed,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Debounced fetch for realtime
  const debouncedFetch = useDebouncedCallback(fetchStats, 300);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats();

    const handleReward = () => debouncedFetch();
    window.addEventListener("camly-reward", handleReward);
    window.addEventListener("reward-claimed", handleReward);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("camly-reward", handleReward);
      window.removeEventListener("reward-claimed", handleReward);
    };
  }, [fetchStats, debouncedFetch]);

  // Persistent ref for tracking previous approved value across renders
  const prevApprovedRef = useRef<number>(-1);
  
  // Keep ref in sync with fetched stats
  useEffect(() => {
    if (!loading && prevApprovedRef.current === -1) {
      prevApprovedRef.current = stats.approvedRewards;
    }
  }, [loading, stats.approvedRewards]);

  // Realtime subscription - with approval notification
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('claim-section-profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          const newApproved = Number(payload.new?.approved_reward || 0);
          if (prevApprovedRef.current >= 0 && newApproved > prevApprovedRef.current) {
            const increase = newApproved - prevApprovedRef.current;
            toast({
              title: "🎉 Phần thưởng đã được duyệt!",
              description: `+${increase.toLocaleString()} CAMLY sẵn sàng để claim!`,
            });
          }
          prevApprovedRef.current = newApproved;
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, debouncedFetch]);

  const progressPercent = Math.min((stats.approvedRewards / CLAIM_THRESHOLD) * 100, 100);
  const dailyLimitReached = stats.dailyClaimed >= DAILY_CLAIM_LIMIT;
  const dailyProgressPercent = Math.min((stats.dailyClaimed / DAILY_CLAIM_LIMIT) * 100, 100);
  const canClaim = stats.approvedRewards >= CLAIM_THRESHOLD && isConnected && !dailyLimitReached;

  const handleClaimClick = () => {
    if (dailyLimitReached) {
      toast({
        title: "🎉 Chúc mừng!",
        description: `Bạn đã đạt giới hạn rút ${DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY trong ngày. Vui lòng quay lại ngày mai!`,
      });
      return;
    }
    setModalOpen(true);
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    tooltip 
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    color: string;
    tooltip?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border bg-gradient-to-br",
        color
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className="text-2xl font-bold">
          {value.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground ml-1">CAMLY</span>
        </p>
      )}
    </motion.div>
  );

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Claim Rewards
        </CardTitle>
        <CardDescription>
          Nhận thưởng CAMLY từ hoạt động trên FUN PLAY
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Trophy}
            label="Tổng đã nhận"
            value={stats.totalRewards}
            color="from-purple-500/10 to-pink-500/10 border-purple-500/20"
            tooltip="Tổng CAMLY bạn đã kiếm được từ mọi hoạt động"
          />
          <StatCard
            icon={CheckCircle}
            label="Có thể Claim"
            value={stats.approvedRewards}
            color="from-green-500/10 to-emerald-500/10 border-green-500/20"
            tooltip="Số CAMLY đã được admin duyệt, có thể rút về ví"
          />
          <StatCard
            icon={Hourglass}
            label="Chờ duyệt"
            value={stats.pendingRewards}
            color="from-amber-500/10 to-yellow-500/10 border-amber-500/20"
            tooltip="Số CAMLY đang chờ admin phê duyệt"
          />
          <StatCard
            icon={Wallet}
            label="Đã Claim"
            value={stats.claimedTotal}
            color="from-blue-500/10 to-cyan-500/10 border-blue-500/20"
            tooltip="Tổng CAMLY bạn đã rút về ví thành công"
          />
        </div>

        {/* Progress to Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ đến ngưỡng Claim</span>
            <span className="font-medium">
              {stats.approvedRewards.toLocaleString()} / {CLAIM_THRESHOLD.toLocaleString()} CAMLY
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          {stats.approvedRewards < CLAIM_THRESHOLD && (
            <p className="text-xs text-muted-foreground">
              Cần thêm {(CLAIM_THRESHOLD - stats.approvedRewards).toLocaleString()} CAMLY để có thể Claim
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isConnected ? (
            <Button
              onClick={connectWithRetry}
              disabled={isConnecting}
              className="flex-1 gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <Wallet className="h-5 w-5" />
              {isConnecting ? "Đang kết nối..." : "Kết nối ví để Claim"}
            </Button>
          ) : (
            <Button
              onClick={handleClaimClick}
              disabled={!canClaim && !dailyLimitReached}
              className={cn(
                "flex-1 gap-2 font-bold",
                dailyLimitReached
                  ? "bg-muted text-muted-foreground"
                  : canClaim
                    ? "bg-gradient-to-r from-[#FFD700] via-[#FFEA00] to-[#E5A800] text-[#7C5800] hover:from-[#FFEA00] hover:via-[#FFD700] hover:to-[#E5A800]"
                    : "bg-muted text-muted-foreground"
              )}
              style={canClaim && !dailyLimitReached ? {
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6)"
              } : undefined}
            >
              <Coins className="h-5 w-5" />
              {dailyLimitReached
                ? "Đã đạt giới hạn hôm nay"
                : canClaim
                  ? "CLAIM CAMLY"
                  : `Cần ${CLAIM_THRESHOLD.toLocaleString()} CAMLY`}
            </Button>
          )}
        </div>

        {/* Daily Limit Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-blue-500" />
              Giới hạn rút hàng ngày
            </span>
            <span className="font-medium">
              {stats.dailyClaimed.toLocaleString()} / {DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY
            </span>
          </div>
          <Progress value={dailyProgressPercent} className="h-2" />
          {dailyLimitReached && (
            <p className="text-xs text-amber-600 font-medium">
              🎉 Bạn đã đạt giới hạn rút hôm nay. Quay lại ngày mai nhé!
            </p>
          )}
        </div>

        {/* Info Notes */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-1.5">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Ngưỡng tối thiểu: 200,000 CAMLY</span>
          </p>
          <p className="flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-amber-500" />
            <span>Phần thưởng được admin duyệt trước khi claim</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Giới hạn rút hàng ngày: {DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY</span>
          </p>
        </div>
      </CardContent>

      <ClaimRewardsModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Admin Quick Approve */}
      <AdminQuickApprove />
    </Card>
  );
};
