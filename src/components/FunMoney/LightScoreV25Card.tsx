/**
 * LightScoreV25Card — 3-Tier Light Score Display
 * Shows: PLS (Personal) + NLS (Network) + LLS (Legacy) → TLS
 * Raw vs Display score, Tier badge, Smart Activation status
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { User, Network, Crown, Sparkles, Shield, Vote, BookOpen, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LIGHT_TIERS_V25,
  getLightTierV25,
  type TLSResult,
  type ActivationStatus,
} from '@/lib/fun-money/light-score-v25';
import { getPhaseWeights } from '@/lib/fun-money/light-score-params-v1';

interface LightScoreV25CardProps {
  tlsResult?: TLSResult;
  activation?: ActivationStatus;
  className?: string;
}

const SCORE_LAYERS = [
  { key: 'pls', label: 'Personal Light', labelVi: 'Ánh Sáng Cá Nhân', icon: User, weight: LIGHT_WEIGHTS.alpha, color: 'text-cyan-500' },
  { key: 'nls', label: 'Network Light', labelVi: 'Ánh Sáng Mạng Lưới', icon: Network, weight: LIGHT_WEIGHTS.beta, color: 'text-green-500' },
  { key: 'lls', label: 'Legacy Light', labelVi: 'Ánh Sáng Di Sản', icon: Crown, weight: LIGHT_WEIGHTS.gamma, color: 'text-amber-500' },
] as const;

const ACTIVATION_ITEMS = [
  { key: 'earning_enabled', label: 'Nhận Thưởng', icon: Sparkles },
  { key: 'voting_enabled', label: 'Biểu Quyết', icon: Vote },
  { key: 'proposal_enabled', label: 'Đề Xuất', icon: BookOpen },
  { key: 'mentor_enabled', label: 'Cố Vấn', icon: Shield },
  { key: 'curator_enabled', label: 'Giám Tuyển', icon: Eye },
  { key: 'validator_enabled', label: 'Xác Thực', icon: Shield },
] as const;

export const LightScoreV25Card = ({
  tlsResult,
  activation,
  className,
}: LightScoreV25CardProps) => {
  // Default/mock values
  const displayScore = tlsResult?.display_tls ?? 0;
  const rawScore = tlsResult?.raw_tls ?? 0;
  const tier = tlsResult?.tier ?? getLightTierV25(0);
  const pls = tlsResult?.raw_pls ?? 0;
  const nls = tlsResult?.raw_nls ?? 0;
  const lls = tlsResult?.raw_lls ?? 0;

  // Progress to next tier
  const currentTierIndex = LIGHT_TIERS_V25.findIndex(t => t.id === tier.id);
  const nextTier = currentTierIndex < LIGHT_TIERS_V25.length - 1 ? LIGHT_TIERS_V25[currentTierIndex + 1] : null;
  const progressPercent = nextTier
    ? ((displayScore - tier.minDisplayScore) / (nextTier.minDisplayScore - tier.minDisplayScore)) * 100
    : 100;

  const rawScores = { pls, nls, lls };

  return (
    <Card className={cn("border-border/50 bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {tier.emoji} Light Score v2.5
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs bg-gradient-to-r text-white border-0", tier.color)}>
            {tier.labelVi}
          </Badge>
        </div>
        <div className="flex items-end gap-3">
          <motion.div
            key={displayScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            {displayScore.toLocaleString()}
          </motion.div>
          <span className="text-[10px] text-muted-foreground pb-1">
            raw: {rawScore.toFixed(2)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 3-Tier Breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">3 TẦNG ÁNH SÁNG</h4>
          <div className="space-y-2">
            {SCORE_LAYERS.map(({ key, labelVi, icon: Icon, weight, color }) => {
              const value = rawScores[key as keyof typeof rawScores];
              const maxForBar = Math.max(pls, nls, lls, 1);
              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", color)} />
                  <span className="text-xs text-muted-foreground w-20 truncate">{labelVi}</span>
                  <div className="flex-1">
                    <Progress value={(value / maxForBar) * 100} className="h-1.5" />
                  </div>
                  <span className="text-xs font-mono w-12 text-right">{value.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground w-6">×{weight}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Activation */}
        {activation && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">KÍCH HOẠT TỰ ĐỘNG</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {ACTIVATION_ITEMS.map(({ key, label, icon: Icon }) => {
                const enabled = activation[key as keyof ActivationStatus];
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[10px]",
                      enabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tier Progression */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{tier.emoji} {tier.labelVi}</span>
            {nextTier && (
              <span>→ {nextTier.emoji} {nextTier.labelVi}: {nextTier.minDisplayScore}</span>
            )}
          </div>
          <Progress value={Math.min(100, progressPercent)} className="h-1 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
};
