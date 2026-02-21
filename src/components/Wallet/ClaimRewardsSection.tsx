import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, CheckCircle, Clock, Wallet, Trophy, Info, Hourglass, Camera, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClaimRewardsModal } from "@/components/Rewards/ClaimRewardsModal";
import { useWalletContext } from "@/contexts/WalletContext";
import { AdminQuickApprove } from "@/components/Wallet/AdminQuickApprove";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CLAIM_THRESHOLD = 200000;

export const ClaimRewardsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, address, connectWithRetry, isConnecting } = useWalletContext();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVerified, setAvatarVerified] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const DAILY_CLAIM_LIMIT = 500000;
  const [claimFreezeUntil, setClaimFreezeUntil] = useState<string | null>(null);
  const [walletRiskStatus, setWalletRiskStatus] = useState<string>('NORMAL');
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
      // Single Source of Truth: RPC get_user_activity_summary
      const [summaryResult, profileResult, dailyResult] = await Promise.all([
        supabase.rpc('get_user_activity_summary', { p_user_id: user.id }),
        supabase.from("profiles").select("avatar_url, avatar_verified, claim_freeze_until, wallet_risk_status").eq("id", user.id).single(),
        supabase.from("daily_claim_records").select("total_claimed").eq("user_id", user.id).eq("date", new Date().toISOString().split('T')[0]).maybeSingle(),
      ]);

      const summary = summaryResult.data as any;
      const profile = profileResult.data;
      const dailyClaimed = Number(dailyResult.data?.total_claimed || 0);

      if (isMountedRef.current) {
        setAvatarUrl(profile?.avatar_url ?? null);
        setAvatarVerified(!!profile?.avatar_verified);
        setClaimFreezeUntil((profile as any)?.claim_freeze_until ?? null);
        setWalletRiskStatus((profile as any)?.wallet_risk_status ?? 'NORMAL');
        setStats({
          totalRewards: Number(summary?.total_camly || 0),
          pendingRewards: Number(summary?.pending_camly || 0),
          approvedRewards: Number(summary?.claimable_balance || 0),
          claimedTotal: Number(summary?.total_claimed || 0),
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
  const isFrozen = claimFreezeUntil && new Date(claimFreezeUntil) > new Date();
  const isBlocked = walletRiskStatus === 'BLOCKED';
  const canClaim = stats.approvedRewards >= CLAIM_THRESHOLD && isConnected && !dailyLimitReached && avatarVerified && !isFrozen && !isBlocked;

  const handleClaimClick = () => {
    if (!avatarUrl) {
      toast({
        title: "📸 Cập nhật hồ sơ để nhận thưởng",
        description: "Vui lòng cập nhật ảnh đại diện trước khi claim CAMLY.",
      });
      return;
    }
    if (!avatarVerified) {
      toast({
        title: "📸 Cần xác minh ảnh chân dung",
        description: "Vui lòng vào Cài đặt hồ sơ và tải lên ảnh chân dung thật để xác minh trước khi claim.",
      });
      navigate("/profile-settings");
      return;
    }
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
          <StatCard
            icon={Trophy}
            label="Tổng đã nhận"
            value={stats.totalRewards}
            color="from-purple-500/10 to-pink-500/10 border-purple-500/20"
            tooltip="Tổng CAMLY bạn đã kiếm được từ mọi hoạt động"
          />
        </div>

        {/* Action Buttons - Right after stats */}
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
                "flex-1 gap-2 font-bold relative overflow-hidden",
                dailyLimitReached
                  ? "bg-muted text-muted-foreground"
                  : canClaim
                    ? "bg-[linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)] text-[#8B6914] border border-[#DAA520]/70 animate-luxury-pulse"
                    : "bg-muted text-muted-foreground"
              )}
              style={canClaim && !dailyLimitReached ? {
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6), 0 0 25px rgba(255,215,0,0.6), 0 0 50px rgba(255,215,0,0.3)"
              } : undefined}
            >
              <Coins className="h-5 w-5 relative z-10" />
              <span className="relative z-10">
              {dailyLimitReached
                ? "Đã đạt giới hạn hôm nay"
                : canClaim
                  ? "CLAIM CAMLY"
                  : !avatarUrl
                    ? "📸 Cần cập nhật ảnh đại diện"
                    : !avatarVerified
                      ? "📸 Cần xác minh ảnh chân dung"
                      : stats.approvedRewards < CLAIM_THRESHOLD
                        ? `Cần ${(CLAIM_THRESHOLD - stats.approvedRewards).toLocaleString()} CAMLY nữa`
                        : `Cần ${CLAIM_THRESHOLD.toLocaleString()} CAMLY`}
              </span>
              {canClaim && !dailyLimitReached && (
                <>
                  <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror-shimmer" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Consolidated Progress Section */}
        <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
          {/* Threshold progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ngưỡng Claim</span>
              <span className="font-medium">
                {stats.approvedRewards.toLocaleString()} / {CLAIM_THRESHOLD.toLocaleString()}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          {/* Daily limit progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3 text-blue-500" />
                Giới hạn hàng ngày
              </span>
              <span className="font-medium">
                {stats.dailyClaimed.toLocaleString()} / {DAILY_CLAIM_LIMIT.toLocaleString()}
              </span>
            </div>
            <Progress value={dailyProgressPercent} className="h-2" />
            {dailyLimitReached && (
              <p className="text-xs text-amber-600 font-medium">
                🎉 Đã đạt giới hạn hôm nay. Quay lại ngày mai!
              </p>
            )}
          </div>
        </div>

        {/* Freeze/Blocked Warning */}
        {!loading && isBlocked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-destructive/15 to-red-500/15 border border-destructive/30">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive font-medium flex-1">
              🚫 Tài khoản bị khóa claim do thay đổi ví bất thường. Vui lòng liên hệ support.
            </p>
          </div>
        )}
        {!loading && isFrozen && !isBlocked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/30">
            <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              🔒 Tài khoản đang được kiểm tra bảo mật do thay đổi ví. Vui lòng thử lại sau: {new Date(claimFreezeUntil!).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* Avatar Warning - Compact */}
        {!loading && !avatarUrl && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-400/30">
            <Camera className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              Cập nhật ảnh đại diện để nhận thưởng
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile-settings")}
              className="text-xs h-7 px-2 border-orange-400/50 text-orange-600 hover:bg-orange-500/10"
            >
              <Camera className="h-3 w-3 mr-1" />
              Cập nhật
            </Button>
          </div>
        )}
        {!loading && avatarUrl && !avatarVerified && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-400/30">
            <Camera className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              Ảnh đại diện chưa xác minh. Vui lòng tải lên ảnh chân dung thật để claim.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile-settings")}
              className="text-xs h-7 px-2 border-orange-400/50 text-orange-600 hover:bg-orange-500/10"
            >
              <Camera className="h-3 w-3 mr-1" />
              Xác minh
            </Button>
          </div>
        )}

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
