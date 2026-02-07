/**
 * Token Lifecycle Panel
 * Visualization of LOCKED → ACTIVATED → FLOWING states
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Zap, Waves, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MintRequest } from '@/hooks/useFunMoneyMintRequest';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';

interface TokenLifecyclePanelProps {
  requests: MintRequest[];
  className?: string;
}

interface LifecycleState {
  status: 'locked' | 'activated' | 'flowing';
  label: string;
  labelVi: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  count: number;
  totalAmount: bigint;
}

export function TokenLifecyclePanel({ requests, className }: TokenLifecyclePanelProps) {
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
        icon: <Lock className="w-6 h-6" />,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
        count: locked.length,
        totalAmount: sumAmount(locked)
      },
      {
        status: 'activated' as const,
        label: 'ACTIVATED',
        labelVi: 'Đã duyệt, chờ mint',
        icon: <Zap className="w-6 h-6" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/20',
        count: activated.length,
        totalAmount: sumAmount(activated)
      },
      {
        status: 'flowing' as const,
        label: 'FLOWING',
        labelVi: 'Đã mint on-chain',
        icon: <Waves className="w-6 h-6" />,
        color: 'text-green-500',
        bgColor: 'bg-green-500/20',
        count: flowing.length,
        totalAmount: sumAmount(flowing)
      }
    ];
  }, [requests]);

  const totalFlowing = states[2].totalAmount;
  const totalAll = states.reduce((acc, s) => acc + s.totalAmount, 0n);
  const progressPercent = totalAll > 0n 
    ? Number((totalFlowing * 100n) / totalAll) 
    : 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Token Lifecycle</h3>
            <p className="text-sm text-muted-foreground">
              Trạng thái FUN tokens của bạn
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Waves className="w-3 h-3" />
            {formatFunAmount(totalFlowing.toString())} đã mint
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Tiến trình mint</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Lifecycle States */}
        <div className="flex items-center gap-2">
          {states.map((state, index) => (
            <div key={state.status} className="flex items-center flex-1">
              {/* State Card */}
              <div className={cn(
                "flex-1 p-4 rounded-xl transition-all",
                state.bgColor,
                state.count > 0 && "ring-2 ring-offset-2 ring-offset-background",
                state.status === 'locked' && state.count > 0 && "ring-yellow-500/50",
                state.status === 'activated' && state.count > 0 && "ring-blue-500/50",
                state.status === 'flowing' && state.count > 0 && "ring-green-500/50"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", state.bgColor, state.color)}>
                    {state.icon}
                  </div>
                  <div>
                    <p className={cn("font-bold text-sm", state.color)}>
                      {state.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {state.labelVi}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className={cn("text-2xl font-black", state.color)}>
                    {state.count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFunAmount(state.totalAmount.toString())}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              {index < states.length - 1 && (
                <ArrowRight className="w-5 h-5 mx-2 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
            <div>
              <Lock className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
              Chờ Admin review
            </div>
            <div>
              <Zap className="w-4 h-4 mx-auto mb-1 text-blue-500" />
              Sẵn sàng mint
            </div>
            <div>
              <Waves className="w-4 h-4 mx-auto mb-1 text-green-500" />
              Đã nhận token
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
