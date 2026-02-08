/**
 * Mint Request Card
 * Individual request display with status and details
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  Coins, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MintRequest } from '@/hooks/useFunMoneyMintRequest';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';

interface MintRequestCardProps {
  request: MintRequest;
  onClick?: () => void;
  showDetails?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Đang chờ',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30'
  },
  approved: {
    label: 'Đã duyệt',
    icon: CheckCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30'
  },
  minted: {
    label: 'Đã mint',
    icon: Coins,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30'
  },
  rejected: {
    label: 'Từ chối',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30'
  },
  failed: {
    label: 'Thất bại',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30'
  }
};

export function MintRequestCard({ request, onClick, showDetails = false }: MintRequestCardProps) {
  const config = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const pillarScores = request.pillar_scores as { S: number; T: number; H: number; C: number; U: number };

  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        config.borderColor,
        onClick && "hover:border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
              <StatusIcon className={cn("w-4 h-4", config.color)} />
            </div>
            <div>
              <Badge variant="outline" className="text-xs mb-1">
                {request.platform_id}
              </Badge>
              <p className="text-sm font-medium">{request.action_type}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={cn("text-lg font-bold", config.color)}>
              {request.calculated_amount_formatted || formatFunAmount(request.calculated_amount_atomic)}
            </p>
            <Badge className={cn("text-xs gap-1", config.bgColor, config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span>AS: <strong className="text-foreground">{request.light_score}</strong></span>
          <span>ĐK: <strong className="text-foreground">{request.unity_score}</strong></span>
          <span>K: <strong className="text-foreground">{Number(request.multiplier_k).toFixed(2)}</strong></span>
        </div>

        {/* Pillar bars */}
        <div className="flex gap-1 mb-3">
          {Object.entries(pillarScores).map(([key, value]) => (
            <div key={key} className="flex-1">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {new Date(request.created_at).toLocaleDateString('vi-VN')}
          </span>
          
          {request.tx_hash ? (
            <a
              href={`https://testnet.bscscan.com/tx/${request.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              BSCScan
            </a>
          ) : onClick ? (
            <ChevronRight className="w-4 h-4" />
          ) : null}
        </div>

        {/* Decision Reason */}
        {showDetails && request.decision_reason && ['rejected', 'failed'].includes(request.status) && (
          <div className={cn("mt-3 p-2 rounded-lg text-xs", config.bgColor)}>
            <p className={config.color}>{request.decision_reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
