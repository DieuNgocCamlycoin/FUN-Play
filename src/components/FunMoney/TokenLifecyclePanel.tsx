/**
 * Token Lifecycle Panel
 * Enhanced visualization of LOCKED → ACTIVATED → FLOWING states
 * With FUN Money logo, animations, and detailed stats
 */

import { useMemo } from 'react';
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
                Token Lifecycle
              </h3>
              <p className="text-sm text-muted-foreground">
                Trạng thái FUN tokens của bạn
              </p>
            </div>
          </div>
          
          {/* Badge showing total minted */}
          <Badge 
            className={cn(
              "gap-1.5 px-3 py-1.5",
              "bg-gradient-to-b from-[#FFEA00] to-[#E5A800]",
              "text-[#7C5800] font-bold",
              "shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]",
              "border-none"
            )}
          >
            <img src={FUN_COIN_LOGO} alt="" className="w-4 h-4" />
            {formatFunAmount(stats.totalFlowing.toString())} đã mint
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
          "grid gap-3 mb-6",
          compactMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
        )}>
          {states.map((state, index) => (
            <div key={state.status} className="flex items-center">
              {/* State Card */}
              <div 
                className={cn(
                  "flex-1 p-4 rounded-xl transition-all cursor-pointer",
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
                    "relative w-16 h-16",
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
                <ArrowRight className="w-6 h-6 mx-2 text-muted-foreground shrink-0 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Detailed Stats Section */}
        {showDetailedStats && (
          <div className="pt-4 border-t border-border/50">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <img src={FUN_COIN_LOGO} alt="" className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground">Total Value</span>
                </div>
                <p className="font-bold text-lg bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  {formatFunAmount(stats.totalAll.toString())}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Light Score</span>
                </div>
                <p className="font-bold text-lg text-foreground">
                  {stats.avgLightScore.toFixed(1)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Unity Score</span>
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
                    Refresh
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

      {/* Custom animations */}
      <style>{`
        @keyframes locked-pulse {
          0%, 100% { 
            filter: grayscale(30%) brightness(0.9);
            transform: scale(1);
          }
          50% { 
            filter: grayscale(30%) brightness(1);
            transform: scale(1.02);
          }
        }
        
        @keyframes activated-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 10px #3B82F6);
            transform: scale(1) rotate(0deg);
          }
          50% { 
            filter: drop-shadow(0 0 20px #60A5FA);
            transform: scale(1.05) rotate(2deg);
          }
        }
        
        @keyframes flowing-shine {
          0% { 
            filter: drop-shadow(0 0 15px #22C55E);
            transform: translateY(0);
          }
          25% { transform: translateY(-5px); }
          50% { 
            filter: drop-shadow(0 0 25px #4ADE80);
            transform: translateY(0);
          }
          75% { transform: translateY(-3px); }
          100% { 
            filter: drop-shadow(0 0 15px #22C55E);
            transform: translateY(0);
          }
        }
        
        @keyframes coin-spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-locked-pulse {
          animation: locked-pulse 2s ease-in-out infinite;
        }
        
        .animate-activated-glow {
          animation: activated-glow 1.5s ease-in-out infinite;
        }
        
        .animate-flowing-shine {
          animation: flowing-shine 2s ease-in-out infinite;
        }
        
        .animate-coin-spin {
          animation: coin-spin 8s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </Card>
  );
}
