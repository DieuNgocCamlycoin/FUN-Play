import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, Sparkles, Gift, CheckCircle, Loader2, ExternalLink, Wallet, Smartphone, AlertCircle, HelpCircle, Clock, ShieldCheck, Info, TrendingUp, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { useClaimNotificationSound } from "@/hooks/useClaimNotificationSound";
import { WalletConnectionProgress } from "@/components/Web3/WalletConnectionProgress";
import { MobileWalletGuide } from "@/components/Web3/MobileWalletGuide";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { isMobileBrowser, isInWalletBrowser, getWalletDeepLink, logWalletDebug, REWARD_WALLET_ADDRESS } from "@/lib/web3Config";
import { cn } from "@/lib/utils";

const MIN_CLAIM_THRESHOLD = 200000; // 200,000 CAMLY minimum to claim

interface ClaimRewardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RewardBreakdown {
  type: string;
  amount: number;
  count: number;
  approved: boolean;
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  VIEW: "Xem video",
  LIKE: "Thích video",
  COMMENT: "Bình luận",
  SHARE: "Chia sẻ",
  UPLOAD: "Upload video",
  FIRST_UPLOAD: "Upload đầu tiên",
  SHORT_VIDEO_UPLOAD: "Upload video ngắn",
  LONG_VIDEO_UPLOAD: "Upload video dài",
  SIGNUP: "Đăng ký",
  WALLET_CONNECT: "Kết nối ví",
  BOUNTY: "Bounty",
};

export const ClaimRewardsModal = ({ open, onOpenChange }: ClaimRewardsModalProps) => {
  const { user } = useAuth();
  const isMobileLayout = useIsMobile();
  const { 
    isConnected, 
    address, 
    connectionStep,
    connectionProgress,
    connectionError,
    connectWithRetry,
    retry,
    cancel,
    isConnecting 
  } = useWalletConnectionWithRetry();
  const { playClaimSound } = useClaimNotificationSound();
  
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [approvedBreakdown, setApprovedBreakdown] = useState<RewardBreakdown[]>([]);
  const [pendingBreakdown, setPendingBreakdown] = useState<RewardBreakdown[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [inWalletApp, setInWalletApp] = useState(false);
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [hasPendingClaim, setHasPendingClaim] = useState(false);
  const [profileCheck, setProfileCheck] = useState<{ hasAvatar: boolean; isVerified: boolean }>({ hasAvatar: true, isVerified: true });
  const [claimElapsed, setClaimElapsed] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const claimInProgressRef = useRef(false);
  const claimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const claimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMobile(isMobileBrowser());
    setInWalletApp(isInWalletBrowser());
    logWalletDebug('ClaimModal detection', { 
      isMobile: isMobileBrowser(), 
      inWalletApp: isInWalletBrowser() 
    });
  }, []);

  // Check for pending claims on modal open
  const checkPendingClaims = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('claim_requests')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1);
    
    if (data && data.length > 0) {
      const pendingClaim = data[0];
      const createdAt = new Date(pendingClaim.created_at).getTime();
      const ageMinutes = (Date.now() - createdAt) / (1000 * 60);
      
      // Auto-cleanup pending claims older than 5 minutes
      if (ageMinutes > 5) {
        console.log(`Auto-cleaning stuck pending claim ${pendingClaim.id} (${ageMinutes.toFixed(1)} min old)`);
        // Call edge function to trigger server-side cleanup, then re-check
        try {
          await supabase.functions.invoke("claim-camly", {
            body: { walletAddress: "0x0000000000000000000000000000000000000000" },
          });
        } catch {
          // Expected to fail with invalid address, but auto-cleanup runs first
        }
        // Re-check after cleanup attempt
        const { data: recheck } = await supabase
          .from('claim_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1);
        setHasPendingClaim((recheck && recheck.length > 0) || false);
        return;
      }
      setHasPendingClaim(true);
    } else {
      setHasPendingClaim(false);
    }
  }, [user?.id]);

  // Fetch profile avatar check on modal open
  const checkProfileAvatar = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, avatar_verified')
      .eq('id', user.id)
      .single();
    setProfileCheck({
      hasAvatar: !!data?.avatar_url,
      isVerified: data?.avatar_verified ?? false,
    });
  }, [user?.id]);

  useEffect(() => {
    if (open && user) {
      fetchUnclaimedRewards();
      checkPendingClaims();
      checkProfileAvatar();
    }
  }, [open, user]);

  // Supabase Realtime subscription for real-time updates when modal is open
  useEffect(() => {
    if (!open || !user?.id) return;

    const rewardsChannel = supabase
      .channel('claim-modal-rewards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchUnclaimedRewards()
      )
      .subscribe();

    // Listen for claim_requests status changes (pending → success/failed)
    const claimsChannel = supabase
      .channel('claim-modal-claims')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'claim_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'success' || newStatus === 'failed') {
            setHasPendingClaim(false);
            fetchUnclaimedRewards();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rewardsChannel);
      supabase.removeChannel(claimsChannel);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [open, user?.id]);

  const fetchUnclaimedRewardsInternal = async () => {
    if (!user) return;
    
    setLoading(true);
    const startTime = Date.now();
    try {
      // Lấy tất cả reward chưa claim
      const { data: rewards, error } = await supabase
        .from("reward_transactions")
        .select("reward_type, amount, approved")
        .eq("user_id", user.id)
        .eq("claimed", false)
        .eq("status", "success");

      if (error) throw error;

      // Separate approved vs pending rewards
      const approvedMap = new Map<string, { amount: number; count: number }>();
      const pendingMap = new Map<string, { amount: number; count: number }>();
      let claimableTotal = 0;
      let pendingTotal = 0;

      rewards?.forEach((r) => {
        const isApproved = r.approved === true;
        const map = isApproved ? approvedMap : pendingMap;
        const existing = map.get(r.reward_type) || { amount: 0, count: 0 };
        map.set(r.reward_type, {
          amount: existing.amount + Number(r.amount),
          count: existing.count + 1,
        });
        if (isApproved) {
          claimableTotal += Number(r.amount);
        } else {
          pendingTotal += Number(r.amount);
        }
      });

      setApprovedBreakdown(
        Array.from(approvedMap.entries()).map(([type, data]) => ({
          type, ...data, approved: true,
        }))
      );
      setPendingBreakdown(
        Array.from(pendingMap.entries()).map(([type, data]) => ({
          type, ...data, approved: false,
        }))
      );
      setTotalClaimable(claimableTotal);
      setTotalPending(pendingTotal);
    } catch (error) {
      console.error("Error fetching unclaimed rewards:", error);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDelay = 300;
      if (elapsed < minDelay) {
        await new Promise(r => setTimeout(r, minDelay - elapsed));
      }
      setLoading(false);
    }
  };

  const fetchUnclaimedRewards = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchUnclaimedRewardsInternal();
    }, 300);
  }, [user]);

  const handleClaim = async () => {
    if (claimInProgressRef.current || hasPendingClaim) return;
    if (!user || !isConnected || !address) {
      toast({
        title: "Vui lòng kết nối ví",
        description: "Bạn cần kết nối ví (MetaMask, Bitget, Trust) để nhận CAMLY",
        variant: "destructive",
      });
      return;
    }

    // Pre-check daily claim limit before calling edge function
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyClaim } = await supabase
        .from('daily_claim_records')
        .select('total_claimed')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const todayClaimed = Number(dailyClaim?.total_claimed) || 0;
      if (todayClaimed >= 500000) {
        toast({
          title: "🎉 Chúc mừng, bạn đã claim thành công!",
          description: "Bạn đã đạt giới hạn rút 500,000 CAMLY trong ngày. Vui lòng quay lại ngày mai để rút tiếp nhé!",
        });
        return;
      }
    } catch {
      // If query fails (no record yet), proceed normally
    }

    claimInProgressRef.current = true;
    setClaiming(true);
    setClaimError(null);
    setClaimElapsed(0);
    
    // Start elapsed timer
    const startTime = Date.now();
    claimTimerRef.current = setInterval(() => {
      setClaimElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    // 90-second timeout
    claimTimeoutRef.current = setTimeout(() => {
      if (claimInProgressRef.current) {
        console.log("Claim timed out after 90 seconds");
        setClaiming(false);
        claimInProgressRef.current = false;
        if (claimTimerRef.current) clearInterval(claimTimerRef.current);
        setClaimError("⏱️ Giao dịch quá thời gian (90s). Vui lòng kiểm tra lại và thử lại.");
        setHasPendingClaim(false);
        checkPendingClaims();
      }
    }, 90000);
    
    logWalletDebug('Starting claim', { 
      userId: user.id, 
      walletAddress: address,
      totalClaimable 
    });
    
    try {
      const response = await supabase.functions.invoke("claim-camly", {
        body: { walletAddress: address },
      });

      logWalletDebug('Claim response', response);

      if (response.error) {
        throw new Error(response.error.message || "Claim failed");
      }

      const data = response.data;

      if (data.success) {
        setClaimSuccess(true);
        setTxHash(data.txHash);

        // Dispatch event để cập nhật UI khắp nơi
        window.dispatchEvent(new CustomEvent("reward-claimed", { 
          detail: { 
            txHash: data.txHash, 
            amount: data.amount 
          } 
        }));

        // 🔔 PHÁT NHẠC CHUÔNG CỐ ĐỊNH KHI CLAIM THÀNH CÔNG
        playClaimSound({ volume: 0.7 });

        // Trigger confetti celebration
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#40E0D0", "#FF69B4", "#00CED1"],
        });

        toast({
          title: "🎉 Rich Rich Rich!",
          description: `${data.amount.toLocaleString()} CAMLY đã được gửi đến ví của bạn!`,
        });
      } else {
        throw new Error(data.error || "Claim failed");
      }
    } catch (error: any) {
      logWalletDebug('Claim error', error);
      const rawMsg = error.message || "";
      
      // Detect daily limit message → show friendly toast instead of error
      if (rawMsg.includes("giới hạn rút") || rawMsg.includes("quay lại ngày mai")) {
        toast({
          title: "🎉 Chúc mừng, bạn đã claim thành công!",
          description: "Bạn đã đạt giới hạn rút 500,000 CAMLY trong ngày. Vui lòng quay lại ngày mai để rút tiếp nhé!",
        });
        return;
      }

      let errorMessage: string;
      
      if (rawMsg.toLowerCase().includes("insufficient funds") || rawMsg.toLowerCase().includes("insufficient_funds")) {
        errorMessage = "⚠️ Hệ thống đang bảo trì ví thưởng. Vui lòng thử lại sau ít phút.";
      } else if (rawMsg.toLowerCase().includes("reward pool temporarily unavailable")) {
        errorMessage = "💰 Bể thưởng tạm thời hết. Vui lòng chờ admin nạp thêm.";
      } else if (rawMsg.toLowerCase().includes("pending claim")) {
        errorMessage = "⏳ Bạn có yêu cầu claim đang xử lý. Vui lòng đợi hoàn tất.";
        setHasPendingClaim(true);
      } else {
        errorMessage = rawMsg || "Không thể claim rewards. Vui lòng thử lại.";
      }
      
      setClaimError(errorMessage);
      toast({
        title: "Lỗi claim",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
      claimInProgressRef.current = false;
      setClaimElapsed(0);
      if (claimTimerRef.current) clearInterval(claimTimerRef.current);
      if (claimTimeoutRef.current) clearTimeout(claimTimeoutRef.current);
      // Refresh balance immediately after claim attempt
      fetchUnclaimedRewards();
    }
  };

  // Handle wallet connection with retry
  const handleConnect = useCallback(async () => {
    logWalletDebug('ClaimModal: Connecting wallet', { isMobile, inWalletApp });
    setClaimError(null);
    await connectWithRetry();
  }, [connectWithRetry, isMobile, inWalletApp]);

  // Open specific wallet app via deep link
  const openWalletApp = useCallback((wallet: 'metamask' | 'bitget' | 'trust') => {
    logWalletDebug('Opening wallet app via deep link', { wallet });
    
    toast({
      title: '🔗 Đang mở ví...',
      description: `Chuyển đến ${wallet === 'metamask' ? 'MetaMask' : wallet === 'bitget' ? 'Bitget Wallet' : 'Trust Wallet'}`,
    });
    
    const deepLink = getWalletDeepLink(wallet);
    
    // Small delay to show toast
    setTimeout(() => {
      window.location.href = deepLink;
    }, 300);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gift className="h-6 w-6 text-yellow-500" />
            </motion.div>
            Claim CAMLY Rewards
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </DialogTitle>
          <DialogDescription className="sr-only">
            Modal để claim phần thưởng CAMLY của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="space-y-4 max-w-lg mx-auto">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : claimSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                Rich Rich Rich! 🎉
              </h3>
              
              <p className="text-muted-foreground">
                CAMLY thật đã được gửi đến ví của bạn!
              </p>

              {txHash && (
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  Xem giao dịch trên BscScan
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              <Button
                onClick={() => {
                  setClaimSuccess(false);
                  setTxHash(null);
                  onOpenChange(false);
                }}
                className="w-full"
              >
                Đóng
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto">
                {/* 💼 VÍ NHẬN THƯỞNG - Compact inline */}
                {isConnected && address ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/30">
                    <Wallet className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs truncate text-foreground">{address}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-green-500 flex-shrink-0">
                      <CheckCircle className="h-3 w-3" /> Đã kết nối
                    </span>
                  </div>
                ) : connectionStep === 'idle' ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30">
                    <Wallet className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Kết nối ví để claim CAMLY</span>
                  </div>
                ) : null}

                {/* ✅ SỐ CAMLY CÓ THỂ CLAIM + CHỜ DUYỆT side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30"
                  >
                    <div className="relative text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Coins className="h-5 w-5 text-green-500" />
                        <span className="text-[10px] text-muted-foreground">Có thể claim</span>
                      </div>
                      <motion.p
                        className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {formatNumber(totalClaimable)}
                      </motion.p>
                      <p className="text-xs text-muted-foreground">CAMLY</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-yellow-500/15 border border-amber-500/30"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <span className="text-[10px] text-muted-foreground">Chờ duyệt</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-amber-500">
                        {formatNumber(totalPending)}
                      </p>
                      <p className="text-xs text-muted-foreground">CAMLY</p>
                    </div>
                  </motion.div>
                </div>

                {/* 🚀 NÚT CLAIM / KẾT NỐI VÍ - Right after amounts */}
                <AnimatePresence>
                  {(isConnecting || connectionStep === 'error' || connectionStep === 'connected') && (
                    <WalletConnectionProgress
                      step={connectionStep}
                      progress={connectionProgress}
                      error={connectionError}
                      onRetry={retry}
                      onCancel={cancel}
                    />
                  )}
                </AnimatePresence>

                {!isConnected && connectionStep === 'idle' ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 py-5 font-bold"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="h-4 w-4 mr-2" />
                      )}
                      Kết nối ví để claim
                    </Button>
                    
                    {isMobile && !inWalletApp && (
                      <div className="space-y-2">
                        <p className="text-xs text-center text-muted-foreground">
                          <Smartphone className="h-3 w-3 inline mr-1" />
                          Hoặc mở trực tiếp trong ứng dụng ví:
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openWalletApp('metamask')} className="flex-1 text-xs">🦊 MetaMask</Button>
                          <Button variant="outline" size="sm" onClick={() => openWalletApp('bitget')} className="flex-1 text-xs">💎 Bitget</Button>
                          <Button variant="outline" size="sm" onClick={() => openWalletApp('trust')} className="flex-1 text-xs">🛡️ Trust</Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowWalletGuide(true)} className="w-full text-xs text-muted-foreground">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Hướng dẫn cài đặt ví
                        </Button>
                      </div>
                    )}

                    {claimError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-destructive font-medium">Lỗi</p>
                            <p className="text-muted-foreground text-xs">{claimError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isConnected ? (
                  <div className="space-y-2">
                    <Button
                      onClick={handleClaim}
                      disabled={claiming || hasPendingClaim || totalClaimable < MIN_CLAIM_THRESHOLD || !profileCheck.hasAvatar}
                      className="w-full bg-gradient-to-r from-yellow-500 to-cyan-500 hover:from-yellow-600 hover:to-cyan-600 text-white font-bold py-5"
                    >
                      {hasPendingClaim ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Đang xử lý giao dịch...
                        </>
                      ) : claiming ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Đang gửi CAMLY... {claimElapsed}s
                        </>
                      ) : totalClaimable < MIN_CLAIM_THRESHOLD ? (
                        `Cần ${formatNumber(Math.max(MIN_CLAIM_THRESHOLD - totalClaimable, 0))} CAMLY nữa`
                      ) : (
                        <>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <Coins className="h-5 w-5 mr-2" />
                          </motion.div>
                          Claim {formatNumber(totalClaimable)} CAMLY
                        </>
                      )}
                    </Button>
                    
                    {/* Force retry button after 30s of claiming */}
                    {claiming && claimElapsed >= 30 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setClaiming(false);
                          claimInProgressRef.current = false;
                          setClaimElapsed(0);
                          if (claimTimerRef.current) clearInterval(claimTimerRef.current);
                          if (claimTimeoutRef.current) clearTimeout(claimTimeoutRef.current);
                          setClaimError(null);
                          checkPendingClaims();
                          fetchUnclaimedRewards();
                        }}
                        className="w-full text-xs border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      >
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        Hủy & Thử lại (đã chờ {claimElapsed}s)
                      </Button>
                    )}
                  </div>
                ) : null}

                {/* Claim error display */}
                {claimError && isConnected && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-destructive font-medium text-xs">Lỗi</p>
                        <p className="text-muted-foreground text-xs">{claimError}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setClaimError(null); checkPendingClaims(); }}
                        className="text-[10px] h-6 px-2"
                      >
                        Thử lại
                      </Button>
                    </div>
                  </div>
                )}

                {/* Compact warnings */}
                {hasPendingClaim && !claiming && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin flex-shrink-0" />
                    <span className="text-muted-foreground flex-1">Giao dịch đang xử lý trên blockchain...</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setHasPendingClaim(false); checkPendingClaims(); fetchUnclaimedRewards(); }}
                      className="text-[10px] h-6 px-2 text-amber-600"
                    >
                      Kiểm tra lại
                    </Button>
                  </div>
                )}

                {!profileCheck.hasAvatar && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs">
                    <Camera className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                    <span className="text-muted-foreground flex-1">Cập nhật ảnh đại diện để claim</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { onOpenChange(false); window.location.href = "/profile-settings"; }}
                      className="text-[10px] h-6 px-2 border-orange-400/50 text-orange-600 hover:bg-orange-500/10"
                    >
                      Cập nhật
                    </Button>
                  </div>
                )}

                {profileCheck.hasAvatar && !profileCheck.isVerified && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs">
                    <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Ảnh đại diện đang chờ xác minh</span>
                  </div>
                )}

                {/* ⏳ Tiến độ đến ngưỡng claim */}
                {totalClaimable > 0 && totalClaimable < MIN_CLAIM_THRESHOLD && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tiến độ claim</span>
                      <span>{formatNumber(totalClaimable)} / {formatNumber(MIN_CLAIM_THRESHOLD)}</span>
                    </div>
                    <Progress value={Math.min((totalClaimable / MIN_CLAIM_THRESHOLD) * 100, 100)} className="h-2" />
                  </div>
                )}

                {/* Thông báo khi không có reward */}
                {totalClaimable === 0 && totalPending === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>Chưa có phần thưởng. Hãy xem video, like, comment để tích lũy CAMLY! 💡</span>
                  </div>
                )}

                {/* ✅ Chi tiết phần thưởng đã duyệt */}
                {approvedBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      Phần thưởng đã duyệt
                    </h4>
                    <ScrollArea className="max-h-36">
                      <div className="space-y-1">
                        {approvedBreakdown.map((item, index) => (
                          <div
                            key={item.type}
                            className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm"
                          >
                            <span>{REWARD_TYPE_LABELS[item.type] || item.type} ({item.count}x)</span>
                            <span className="font-medium text-green-500">+{formatNumber(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* ⏳ Chi tiết phần thưởng chờ duyệt */}
                {pendingBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Chờ admin duyệt
                    </h4>
                    <ScrollArea className="max-h-36">
                      <div className="space-y-1">
                        {pendingBreakdown.map((item, index) => (
                          <div
                            key={item.type}
                            className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm"
                          >
                            <span>{REWARD_TYPE_LABELS[item.type] || item.type} ({item.count}x)</span>
                            <span className="font-medium text-amber-500">+{formatNumber(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Giải thích quy trình */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    Phần thưởng được admin duyệt trước khi claim
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
                    Ngưỡng tối thiểu: {formatNumber(MIN_CLAIM_THRESHOLD)} CAMLY
                  </p>
                </div>
            </div>
          )}
          
          {/* Angel hint - Full width at bottom */}
          {!loading && !claimSuccess && (
            <motion.p
              className="text-center text-xs text-muted-foreground italic mt-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨ Angel says: "Rich Rich Rich rewards waiting for you!" ✨
            </motion.p>
          )}
        </div>
        
        {/* Mobile Wallet Guide */}
        <MobileWalletGuide 
          open={showWalletGuide} 
          onOpenChange={setShowWalletGuide}
          trigger={<></>}
        />
      </DialogContent>
    </Dialog>
  );
};
