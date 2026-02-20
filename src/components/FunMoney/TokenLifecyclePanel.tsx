/**
 * Token Lifecycle Panel
 * Enhanced visualization of LOCKED → ACTIVATED → FLOWING states
 * With FUN Money logo, animations, and detailed stats
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Zap, Waves, ArrowRight, RefreshCw, ExternalLink, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MintRequest } from '@/hooks/useFunMoneyMintRequest';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';

interface TokenLifecyclePanelProps {
  requests: MintRequest[];
  className?: string;
  onStateClick?: (state: 'locked' | 'activated' | 'flowing') => void;
  onViewAll?: () => void;
  onRefresh?: () => void;
  showDetailedStats?: boolean;
  compactMode?: boolean;
}

interface LifecycleState {
  status: 'locked' | 'activated' | 'flowing';
  label: string;
  labelVi: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  glowColor: string;
  animationClass: string;
  count: number;
  totalAmount: bigint;
}

// FUN Money coin logo
const FUN_COIN_LOGO = '/images/fun-money-coin.png';

export function TokenLifecyclePanel({ 
  requests, 
  className,
  onStateClick,
  onViewAll,
  onRefresh,
  showDetailedStats = true,
  compactMode = false
}: TokenLifecyclePanelProps) {
  const states = useMemo<LifecycleState[]>(() => {
    const locked = requests.filter(r => r.status === 'pending');
    const activated = requests.filter(r => r.status === 'approved');
    const flowing = requests.filter(r => r.status === 'minted');

    const sumAmount = (items: MintRequest[]) => 
      items.reduce((acc, r) => acc + BigInt(r.calculated_amount_atomic || '0'), 0n);

    return [
      {
        status: 'locked' as const,
        label: 'LOCKED',
        labelVi: 'Đang chờ duyệt',
        icon: <Lock className="w-5 h-5" />,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
        glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]',
        animationClass: 'animate-locked-pulse',
        count: locked.length,
        totalAmount: sumAmount(locked)
      },
      {
        status: 'activated' as const,
        label: 'ACTIVATED',
        labelVi: 'Sẵn sàng mint',
        icon: <Zap className="w-5 h-5" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/20',
        glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
        animationClass: 'animate-activated-glow',
        count: activated.length,
        totalAmount: sumAmount(activated)
      },
      {
        status: 'flowing' as const,
        label: 'FLOWING',
        labelVi: 'Đã mint on-chain',
        icon: <Waves className="w-5 h-5" />,
        color: 'text-green-500',
        bgColor: 'bg-green-500/20',
        glowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
        animationClass: 'animate-flowing-shine',
        count: flowing.length,
        totalAmount: sumAmount(flowing)
      }
    ];
  }, [requests]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFlowing = states[2].totalAmount;
    const totalAll = states.reduce((acc, s) => acc + s.totalAmount, 0n);
    const progressPercent = totalAll > 0n 
      ? Number((totalFlowing * 100n) / totalAll) 
      : 0;

    const mintedRequests = requests.filter(r => r.status === 'minted');
    const avgLightScore = mintedRequests.length > 0
      ? mintedRequests.reduce((acc, r) => acc + r.light_score, 0) / mintedRequests.length
      : 0;
    const avgUnityScore = mintedRequests.length > 0
      ? mintedRequests.reduce((acc, r) => acc + r.unity_score, 0) / mintedRequests.length
      : 0;
    
    const txCount = mintedRequests.filter(r => r.tx_hash).length;

    return {
      totalFlowing,
      totalAll,
      progressPercent,
      avgLightScore,
      avgUnityScore,
      txCount
    };
  }, [requests, states]);

  return (
    <Card className={cn(
      "overflow-hidden border-border/50",
      "bg-gradient-to-br from-background via-background to-muted/20",
      className
    )}>
      <CardContent className={cn("p-6", compactMode && "p-4")}>
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={FUN_COIN_LOGO} 
                alt="FUN Money" 
                className="w-12 h-12 rounded-full animate-coin-spin"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/30 to-amber-500/30 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Vòng đời Token
              </h3>
              <p className="text-sm text-muted-foreground">
                Trạng thái FUN tokens của bạn
              </p>
            </div>
          </div>
          
          {/* Badge showing total minted */}
          <Badge 
            className={cn(
              "gap-1.5 px-3 py-1.5 relative overflow-hidden",
              "bg-[linear-gradient(90deg,#F9E37A_0%,#FFD700_20%,#FFEC8B_40%,#FFF8DC_50%,#FFEC8B_60%,#FFD700_80%,#F9E37A_100%)]",
              "text-[#8B6914] font-bold",
              "shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_0_25px_rgba(255,215,0,0.6),0_0_50px_rgba(255,215,0,0.3)]",
              "border border-[#DAA520]/70"
            )}
          >
            <img src={FUN_COIN_LOGO} alt="" className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{formatFunAmount(stats.totalFlowing.toString())} đã mint</span>
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent pointer-events-none" />
          </Badge>
        </div>

        {/* Progress Bar with Aurora Gradient */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Tiến trình mint</span>
            <span className="font-mono font-bold text-foreground">{stats.progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden relative">
            {/* Background glow */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-blue-500/20 to-green-500/20"
              style={{ width: `${stats.progressPercent}%` }}
            />
            {/* Main progress */}
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 via-blue-500 to-green-500 rounded-full transition-all duration-500 relative"
              style={{ width: `${stats.progressPercent}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Lifecycle States - 3 Columns */}
        <div className={cn(
          "flex mb-6 gap-3",
          compactMode ? "flex-col" : "flex-col md:flex-row md:items-stretch"
        )}>
          {states.map((state, index) => (
            <React.Fragment key={state.status}>
              {/* State Card */}
              <div 
                className={cn(
                  "flex-1 min-w-0 p-4 rounded-xl transition-all cursor-pointer",
                  "border border-border/50 hover:border-border",
                  state.bgColor,
                  state.count > 0 && state.glowColor,
                  onStateClick && "hover:scale-[1.02]"
                )}
                onClick={() => onStateClick?.(state.status)}
              >
                {/* Coin with Animation */}
                <div className="flex justify-center mb-3">
                  <div className={cn(
                    "relative w-12 h-12 sm:w-16 sm:h-16",
                    state.count > 0 && state.animationClass
                  )}>
                    <img 
                      src={FUN_COIN_LOGO} 
                      alt={state.label}
                      className={cn(
                        "w-full h-full rounded-full",
                        state.count === 0 && "grayscale opacity-50"
                      )}
                    />
                    {/* State icon overlay */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 p-1.5 rounded-full",
                      state.bgColor,
                      "border-2 border-background"
                    )}>
                      <div className={state.color}>{state.icon}</div>
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="text-center mb-2">
                  <p className={cn("font-bold text-sm", state.color)}>
                    {state.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {state.labelVi}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-center space-y-1">
                  <p className={cn("text-3xl font-black", state.color)}>
                    {state.count}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {formatFunAmount(state.totalAmount.toString())}
                  </p>
                </div>
              </div>

              {/* Arrow between states */}
              {index < states.length - 1 && !compactMode && (
                <div className="flex items-center justify-center shrink-0 py-1 md:py-0 md:px-1">
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground rotate-90 md:rotate-0" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Detailed Stats Section */}
        {showDetailedStats && (
          <div className="pt-4 border-t border-border/50">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <img src={FUN_COIN_LOGO} alt="" className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground">Tổng giá trị</span>
                </div>
                <p className="font-bold text-lg bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  {formatFunAmount(stats.totalAll.toString())}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Điểm Ánh Sáng</span>
                </div>
                <p className="font-bold text-lg text-foreground">
                  {stats.avgLightScore.toFixed(1)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Điểm Đoàn Kết</span>
                </div>
                <p className="font-bold text-lg text-foreground">
                  {stats.avgUnityScore.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {onViewAll && (
                  <Button variant="outline" size="sm" onClick={onViewAll}>
                    Xem tất cả
                  </Button>
                )}
                {onRefresh && (
                  <Button variant="ghost" size="sm" onClick={onRefresh}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Làm mới
                  </Button>
                )}
              </div>
              
              {stats.txCount > 0 && (
                <a
                  href="https://testnet.bscscan.com/token/0x1aa8BF20E0b6aE9e5C0b36e7bF8C8Faab015ff2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  BSCScan: {stats.txCount} tx
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>

    </Card>
  );
}
