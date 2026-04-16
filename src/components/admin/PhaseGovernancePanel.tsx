/**
 * PhaseGovernancePanel — Admin panel for system phase management
 * Shows current phase, α/β/γ weights, and phase switch controls
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings2, TrendingUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TLS_PHASE_WEIGHTS,
  CURRENT_PHASE,
  type SystemPhase,
} from '@/lib/fun-money/light-score-params-v1';

interface PhaseGovernancePanelProps {
  currentPhase?: SystemPhase;
  onPhaseChange?: (phase: SystemPhase) => void;
  className?: string;
  readOnly?: boolean;
}

const PHASE_CONFIG: Record<SystemPhase, { label: string; emoji: string; color: string; description: string }> = {
  early: {
    label: 'Early',
    emoji: '🌱',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description: 'Ưu tiên cá nhân (PLS), khuyến khích hành động sớm',
  },
  growth: {
    label: 'Growth',
    emoji: '🚀',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    description: 'Cân bằng cá nhân + mạng lưới, mở rộng hệ sinh thái',
  },
  mature: {
    label: 'Mature',
    emoji: '👑',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description: 'Ưu tiên di sản + mạng lưới, giá trị bền vững',
  },
};

const WEIGHT_LABELS = [
  { key: 'alpha' as const, label: 'α (Personal Light)', icon: '👤', color: 'bg-cyan-500' },
  { key: 'beta' as const, label: 'β (Network Light)', icon: '🌐', color: 'bg-green-500' },
  { key: 'gamma' as const, label: 'γ (Legacy Light)', icon: '👑', color: 'bg-amber-500' },
];

export const PhaseGovernancePanel = ({
  currentPhase = CURRENT_PHASE,
  onPhaseChange,
  className,
  readOnly = false,
}: PhaseGovernancePanelProps) => {
  const weights = TLS_PHASE_WEIGHTS[currentPhase];
  const config = PHASE_CONFIG[currentPhase];

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Phase Governance
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.emoji} {config.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weight Distribution */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">TLS WEIGHTS</h4>
          <div className="space-y-2">
            {WEIGHT_LABELS.map(({ key, label, icon, color }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-sm w-5">{icon}</span>
                <span className="text-xs text-muted-foreground flex-1">{label}</span>
                <Progress value={weights[key] * 100} className="w-24 h-2" />
                <span className="text-xs font-mono w-10 text-right">{(weights[key] * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Comparison */}
        <div className="border-t border-border/50 pt-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">ALL PHASES</h4>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(PHASE_CONFIG) as [SystemPhase, typeof config][]).map(([phase, cfg]) => {
              const w = TLS_PHASE_WEIGHTS[phase];
              const isActive = phase === currentPhase;
              return (
                <button
                  key={phase}
                  disabled={readOnly || isActive}
                  onClick={() => onPhaseChange?.(phase)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : readOnly
                        ? "border-border/50 opacity-50"
                        : "border-border/50 hover:border-primary/30 cursor-pointer"
                  )}
                >
                  <div className="text-sm">{cfg.emoji}</div>
                  <div className="text-[10px] font-medium">{cfg.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-1">
                    {w.alpha}/{w.beta}/{w.gamma}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sum check */}
        <div className="text-[10px] text-muted-foreground text-center">
          α + β + γ = {(weights.alpha + weights.beta + weights.gamma).toFixed(1)}
        </div>
      </CardContent>
    </Card>
  );
};
