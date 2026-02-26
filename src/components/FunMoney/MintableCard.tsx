/**
 * Mintable FUN Card
 * Displays user's mintable FUN with 1-click MINT button
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Coins, 
  Loader2, 
  Info, 
  AlertCircle,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LightActivity } from '@/hooks/useLightActivity';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { useAutoMintRequest } from '@/hooks/useFunMoneyMintRequest';

interface MintableCardProps {
  activity: LightActivity | null;
  loading?: boolean;
  onMintSuccess?: () => void;
}

export function MintableCard({ activity, loading, onMintSuccess }: MintableCardProps) {
  const [isMinting, setIsMinting] = useState(false);
  
  const { 
    isConnected: isWalletConnected, 
    address, 
    connect,
    isCorrectChain,
    switchToBscTestnet
  } = useFunMoneyWallet();
  
  const { submitAutoRequest, loading: submitLoading, error: mintError } = useAutoMintRequest();

  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchChain = async () => {
    setIsSwitching(true);
    try {
      await switchToBscTestnet();
      toast.success('✅ Đã chuyển sang BSC Testnet');
    } catch {
      toast.error('Không thể chuyển mạng');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleMint = async () => {
    if (!activity || !activity.canMint) return;
    
    if (!isWalletConnected) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }
    
    // Tự động chuyển mạng nếu sai chain
    if (!isCorrectChain) {
      setIsSwitching(true);
      try {
        await switchToBscTestnet();
        toast.info('✅ Đã chuyển mạng, đang gửi yêu cầu mint...');
      } catch {
        toast.error('Không thể chuyển mạng. Vui lòng chuyển thủ công.');
        setIsSwitching(false);
        return;
      }
      setIsSwitching(false);
    }

    setIsMinting(true);
    try {
      console.log('[MintableCard] Submitting auto mint request...', {
        wallet: address,
        lightScore: activity.lightScore,
        mintableFun: activity.mintableFun,
        mintableFunAtomic: activity.mintableFunAtomic
      });

      const result = await submitAutoRequest({
        userWalletAddress: address!,
        pillars: activity.pillars,
        lightScore: activity.lightScore,
        unityScore: activity.unityScore,
        unitySignals: activity.unitySignals,
        mintableFunAtomic: activity.mintableFunAtomic,
        activitySummary: activity.activityCounts
      });

      if (result) {
        toast.success('🎉 Yêu cầu Mint đã được gửi!', {
          description: `${activity.mintableFun} FUN • Request #${result.id.slice(0, 8)}. Admin sẽ duyệt và mint on-chain cho bạn.`,
          duration: 8000
        });
        onMintSuccess?.();
      } else {
        // mintError may not be available yet (async state), so use a timeout to read it
        setTimeout(() => {
          toast.error('❌ Gửi yêu cầu mint thất bại', {
            description: mintError || 'Vui lòng thử lại sau hoặc liên hệ Admin.',
            duration: 6000
          });
        }, 100);
      }
    } catch (err: any) {
      console.error('[MintableCard] Unexpected error:', err);
      toast.error('Lỗi khi tạo mint request', {
        description: err.message
      });
    } finally {
      setIsMinting(false);
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!activity) {
    return (
      <Card className="relative overflow-hidden bg-muted/50">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Không thể tải dữ liệu hoạt động</p>
        </CardContent>
      </Card>
    );
  }

  const mintableFunNum = parseFloat(activity.mintableFun);
  const canMint = activity.canMint && isWalletConnected && isCorrectChain;

  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      
      <CardContent className="relative py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wide">
              Mintable FUN
            </h2>
          </div>
        </div>

        {/* Main Amount */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            <span className="text-3xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {mintableFunNum.toLocaleString()}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">FUN</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Token trên BSC Testnet — chưa có giá thị trường
          </p>
        </div>

        {/* Light Score Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              Điểm Ánh Sáng
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Điểm ánh sáng được tính từ 5 trụ cột: S, T, H, C, U</p>
                    <p className="text-xs text-muted-foreground mt-1">Cần tối thiểu 60 để mint</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className={cn(
              "font-bold",
              activity.lightScore >= 60 ? "text-green-500" : "text-yellow-500"
            )}>
              {activity.lightScore}/100
            </span>
          </div>
          <Progress 
            value={activity.lightScore} 
            className={cn(
              "h-3",
              activity.lightScore >= 60 ? "[&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500" : ""
            )}
          />
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Wallet className="w-3.5 h-3.5" />
            {isWalletConnected ? (
              <>
                {address?.slice(0, 6)}...{address?.slice(-4)}
                {isCorrectChain ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                )}
              </>
            ) : (
              'Chưa kết nối'
            )}
          </Badge>
          
          <Badge 
            variant={activity.hasPendingRequest ? "secondary" : "outline"}
            className={activity.hasPendingRequest ? "bg-yellow-500/20 text-yellow-600" : ""}
          >
            {activity.hasPendingRequest ? 'Có request đang chờ' : 'Sẵn sàng mint'}
          </Badge>
        </div>

        {/* Mint Button or Connect Button */}
        {!isWalletConnected ? (
          <Button 
            onClick={connect}
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2"
          >
            <Wallet className="w-5 h-5" />
            Kết Nối Ví
          </Button>
        ) : !isCorrectChain ? (
          <Button
            onClick={handleSwitchChain}
            disabled={isSwitching}
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2 bg-yellow-500/20 text-yellow-600 border border-yellow-500/50 hover:bg-yellow-500/30"
          >
            {isSwitching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {isSwitching ? 'Đang chuyển mạng...' : 'Chuyển sang BSC Testnet'}
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    onClick={handleMint}
                    disabled={!canMint || isMinting || submitLoading}
                    size="lg"
                    className={cn(
                      "w-full h-14 text-lg font-bold gap-2 transition-all duration-300 relative overflow-hidden",
                      canMint && !isMinting && "bg-[linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)] text-[#8B6914] hover:scale-[1.02] border border-[#DAA520]/70 animate-luxury-pulse",
                      (!canMint || isMinting) && "opacity-50 cursor-not-allowed"
                    )}
                    style={canMint && !isMinting ? {
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 0 25px rgba(255,215,0,0.6), 0 0 50px rgba(255,215,0,0.3)'
                    } : {}}
                  >
                    {isMinting || submitLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tạo request...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">MINT NOW</span>
                        {/* Glossy highlight */}
                        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-full pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror-shimmer" />
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!canMint && activity.mintBlockReason && (
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <p>{activity.mintBlockReason}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{(activity.totalFunReward ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Tổng FUN</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{(activity.alreadyMintedFun ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Đã Mint</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{activity.accountAgeDays}d</p>
            <p className="text-xs text-muted-foreground">Tuổi tài khoản</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
