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
    isCorrectChain 
  } = useFunMoneyWallet();
  
  const { submitAutoRequest, loading: submitLoading } = useAutoMintRequest();

  const handleMint = async () => {
    if (!activity || !activity.canMint) return;
    
    if (!isWalletConnected) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }
    
    if (!isCorrectChain) {
      toast.error('Vui lòng chuyển sang BSC Testnet');
      return;
    }

    setIsMinting(true);
    try {
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
        toast.success('🎉 Mint request đã được tạo!', {
          description: 'Đang chờ Admin duyệt'
        });
        onMintSuccess?.();
      }
    } catch (err: any) {
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
          <p className="text-muted-foreground">
            ≈ ${activity.mintableFunUsd} USD
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
                      "w-full h-14 text-lg font-bold gap-2 transition-all duration-300",
                      canMint && !isMinting && "bg-gradient-to-r from-[#F9E37A] via-[#F0D96C] to-[#B78C1A] hover:from-[#F0D96C] hover:via-[#E8D060] hover:to-[#A07818] text-[#A9710F] shadow-lg hover:shadow-xl hover:scale-[1.02]",
                      (!canMint || isMinting) && "opacity-50 cursor-not-allowed"
                    )}
                    style={canMint && !isMinting ? {
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.1), 0 4px 12px rgba(198,143,26,0.3)'
                    } : {}}
                  >
                    {isMinting || submitLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tạo request...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        MINT NOW
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
            <p className="text-2xl font-bold text-primary">{activity.totalActivities}</p>
            <p className="text-xs text-muted-foreground">Hoạt động</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{activity.camlyEarned.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">CAMLY đã nhận</p>
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
