import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, Sparkles, Gift, CheckCircle, Loader2, ExternalLink, Wallet, Smartphone, AlertCircle, HelpCircle, Clock, ShieldCheck, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { useClaimNotificationSound } from "@/hooks/useClaimNotificationSound";
import { WalletConnectionProgress } from "@/components/Web3/WalletConnectionProgress";
import { MobileWalletGuide } from "@/components/Web3/MobileWalletGuide";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { isMobileBrowser, isInWalletBrowser, getWalletDeepLink, logWalletDebug, REWARD_WALLET_ADDRESS } from "@/lib/web3Config";

const MIN_CLAIM_THRESHOLD = 200000; // 200,000 CAMLY minimum to claim

interface ClaimRewardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RewardBreakdown {
  type: string;
  amount: number;
  count: number;
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  view: "Xem video",
  like: "Thích video",
  comment: "Bình luận",
  share: "Chia sẻ",
  upload: "Upload video",
  first_upload: "Upload đầu tiên",
  signup: "Đăng ký",
  wallet_connect: "Kết nối ví",
};

export const ClaimRewardsModal = ({ open, onOpenChange }: ClaimRewardsModalProps) => {
  const { user } = useAuth();
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
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);
  const [totalPending, setTotalPending] = useState(0); // Chờ admin duyệt
  const [breakdown, setBreakdown] = useState<RewardBreakdown[]>([]);
  const [pendingBreakdown, setPendingBreakdown] = useState<RewardBreakdown[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [inWalletApp, setInWalletApp] = useState(false);
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(isMobileBrowser());
    setInWalletApp(isInWalletBrowser());
    logWalletDebug('ClaimModal detection', { 
      isMobile: isMobileBrowser(), 
      inWalletApp: isInWalletBrowser() 
    });
  }, []);

  useEffect(() => {
    if (open && user) {
      fetchUnclaimedRewards();
    }
  }, [open, user]);

  const fetchUnclaimedRewards = async () => {
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

      // Phân tách reward đã duyệt và chưa duyệt
      const approvedBreakdownMap = new Map<string, { amount: number; count: number }>();
      const pendingBreakdownMap = new Map<string, { amount: number; count: number }>();
      let approvedTotal = 0;
      let pendingTotal = 0;

      rewards?.forEach((r) => {
        const isApproved = r.approved === true;
        const targetMap = isApproved ? approvedBreakdownMap : pendingBreakdownMap;
        
        const existing = targetMap.get(r.reward_type) || { amount: 0, count: 0 };
        targetMap.set(r.reward_type, {
          amount: existing.amount + Number(r.amount),
          count: existing.count + 1,
        });
        
        if (isApproved) {
          approvedTotal += Number(r.amount);
        } else {
          pendingTotal += Number(r.amount);
        }
      });

      // Set breakdown cho rewards đã duyệt (có thể claim)
      setBreakdown(
        Array.from(approvedBreakdownMap.entries()).map(([type, data]) => ({
          type,
          ...data,
        }))
      );
      setTotalUnclaimed(approvedTotal);

      // Set breakdown cho rewards chưa duyệt (chờ admin)
      setPendingBreakdown(
        Array.from(pendingBreakdownMap.entries()).map(([type, data]) => ({
          type,
          ...data,
        }))
      );
      setTotalPending(pendingTotal);
    } catch (error) {
      console.error("Error fetching unclaimed rewards:", error);
    } finally {
      // Ensure minimum loading time for smooth UX
      const elapsed = Date.now() - startTime;
      const minDelay = 300;
      if (elapsed < minDelay) {
        await new Promise(r => setTimeout(r, minDelay - elapsed));
      }
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !isConnected || !address) {
      toast({
        title: "Vui lòng kết nối ví",
        description: "Bạn cần kết nối ví (MetaMask, Bitget, Trust) để nhận CAMLY",
        variant: "destructive",
      });
      return;
    }

    setClaiming(true);
    setClaimError(null);
    
    logWalletDebug('Starting claim', { 
      userId: user.id, 
      walletAddress: address,
      totalUnclaimed 
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
      const errorMessage = error.message || "Không thể claim rewards. Vui lòng thử lại.";
      setClaimError(errorMessage);
      toast({
        title: "Lỗi claim",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
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

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {/* Skeleton for reward card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-cyan-500/10 to-yellow-500/10 border border-yellow-500/20">
                <div className="text-center space-y-3">
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-10 w-40 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </div>
              {/* Skeleton for breakdown items */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              {/* Skeleton for button */}
              <Skeleton className="h-12 w-full rounded-lg" />
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
            <>
              {/* Total Unclaimed */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative p-6 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-cyan-500/20 to-yellow-500/20 border border-yellow-500/30"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255, 215, 0, 0.3)",
                      "0 0 40px rgba(64, 224, 208, 0.3)",
                      "0 0 20px rgba(255, 215, 0, 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className="relative text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Coins className="h-8 w-8 text-yellow-500" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground">Phần thưởng chờ claim</span>
                  </div>
                  
                  <motion.p
                    className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatNumber(totalUnclaimed)}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">CAMLY</p>
                </div>
              </motion.div>

              {/* Breakdown - Rewards đã duyệt */}
              {/* Thông báo ngưỡng claim */}
              {totalUnclaimed >= MIN_CLAIM_THRESHOLD && (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-600 font-semibold">
                    🎉 Đủ điều kiện claim!
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Bạn có thể claim {formatNumber(totalUnclaimed)} CAMLY về ví ngay bây giờ!
                  </AlertDescription>
                </Alert>
              )}

              {totalUnclaimed > 0 && totalUnclaimed < MIN_CLAIM_THRESHOLD && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600">Tiến độ đến ngưỡng claim</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatNumber(totalUnclaimed)} CAMLY</span>
                      <span>{formatNumber(MIN_CLAIM_THRESHOLD)} CAMLY</span>
                    </div>
                    <Progress value={Math.min((totalUnclaimed / MIN_CLAIM_THRESHOLD) * 100, 100)} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {((totalUnclaimed / MIN_CLAIM_THRESHOLD) * 100).toFixed(0)}% hoàn thành
                    </p>
                  </div>
                  
                  {/* Còn bao nhiêu */}
                  <p className="text-sm text-muted-foreground">
                    Còn cần thêm <span className="font-bold text-blue-500">{formatNumber(MIN_CLAIM_THRESHOLD - totalUnclaimed)}</span> CAMLY để claim tự động.
                  </p>
                  
                  {/* Gợi ý */}
                  <p className="text-xs text-muted-foreground italic">
                    💡 Tiếp tục xem video, like, comment để tích lũy thêm phần thưởng!
                  </p>
                </div>
              )}

              {breakdown.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Phần thưởng đã duyệt (có thể claim)
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {breakdown.map((item, index) => (
                      <motion.div
                        key={item.type}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <span className="text-sm">
                          {REWARD_TYPE_LABELS[item.type] || item.type} ({item.count}x)
                        </span>
                        <span className="font-medium text-green-500">
                          +{formatNumber(item.amount)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông báo pending rewards - CHỜ DUYỆT */}
              {totalPending > 0 && (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-600 font-semibold">
                    Phần thưởng đang chờ duyệt
                  </AlertTitle>
                  <AlertDescription className="text-sm space-y-2">
                    <p className="text-muted-foreground">
                      Bạn có <span className="font-bold text-yellow-500">{formatNumber(totalPending)} CAMLY</span> đang chờ Admin duyệt.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Sau khi Admin duyệt, bạn có thể claim phần thưởng này. Thời gian duyệt thường từ 1-24 giờ.
                    </p>
                    
                    {/* Chi tiết pending */}
                    {pendingBreakdown.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {pendingBreakdown.map((item, index) => (
                          <div
                            key={item.type}
                            className="flex items-center justify-between p-1.5 rounded bg-yellow-500/5 text-xs"
                          >
                            <span className="text-muted-foreground">
                              {REWARD_TYPE_LABELS[item.type] || item.type} ({item.count}x)
                            </span>
                            <span className="text-yellow-500">
                              +{formatNumber(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Thông báo khi không có reward nào để claim */}
              {totalUnclaimed === 0 && totalPending > 0 && (
                <Alert className="border-orange-500/30 bg-orange-500/10">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertTitle className="text-orange-600 font-semibold">
                    Chưa thể claim
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Tất cả phần thưởng của bạn đang chờ Admin duyệt. Vui lòng quay lại sau khi nhận được thông báo duyệt!
                  </AlertDescription>
                </Alert>
              )}

              {/* Connection Progress Indicator */}
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

              {/* Wallet Connection */}
              {!isConnected && connectionStep === 'idle' ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="h-4 w-4 mr-2" />
                    )}
                    Kết nối ví để claim
                  </Button>
                  
                  {/* Mobile deep link buttons */}
                  {isMobile && !inWalletApp && (
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        <Smartphone className="h-3 w-3 inline mr-1" />
                        Hoặc mở trực tiếp trong ứng dụng ví:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWalletApp('metamask')}
                          className="flex-1 text-xs"
                        >
                          🦊 MetaMask
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWalletApp('bitget')}
                          className="flex-1 text-xs"
                        >
                          💎 Bitget
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWalletApp('trust')}
                          className="flex-1 text-xs"
                        >
                          🛡️ Trust
                        </Button>
                      </div>
                      
                      {/* Help button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWalletGuide(true)}
                        className="w-full text-xs text-muted-foreground"
                      >
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Hướng dẫn cài đặt ví
                      </Button>
                    </div>
                  )}
                  
                  {/* Show error if any */}
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
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <span className="text-muted-foreground">Ví nhận:</span>
                    <p className="font-mono text-xs truncate">{address}</p>
                  </div>

                  <Button
                    onClick={handleClaim}
                    disabled={claiming || totalUnclaimed < MIN_CLAIM_THRESHOLD}
                    className="w-full bg-gradient-to-r from-yellow-500 to-cyan-500 hover:from-yellow-600 hover:to-cyan-600 text-white font-bold py-6"
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Đang gửi CAMLY...
                      </>
                    ) : totalUnclaimed < MIN_CLAIM_THRESHOLD ? (
                      `Cần ${formatNumber(Math.max(MIN_CLAIM_THRESHOLD - totalUnclaimed, 0))} CAMLY nữa`
                    ) : (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Coins className="h-5 w-5 mr-2" />
                        </motion.div>
                        Claim {formatNumber(totalUnclaimed)} CAMLY
                      </>
                    )}
                  </Button>
                </div>
              ) : null}

              {/* Angel hint */}
              <motion.p
                className="text-center text-xs text-muted-foreground italic"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨ Angel says: "Rich Rich Rich rewards waiting for you!" ✨
              </motion.p>
            </>
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
