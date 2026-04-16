/**
 * PPLP v2.0 Score Card — Phase 6 UI
 * Displays 5 new pillars + dimensions breakdown
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Shield, Brain, Heart } from 'lucide-react';
import { PILLAR_V2_CONFIGS, PILLAR_V2_LIST, getLightLevelV2, type PillarV2 } from '@/lib/fun-money/pplp-engine-v2';
import { cn } from '@/lib/utils';

interface PPLPv2ScoreCardProps {
  lightScoreV2: number;
  pillarBreakdown?: Record<PillarV2, number>;
  dimensions?: {
    intent: number;
    depth: number;
    impact: number;
    consistency: number;
    trust_factor: number;
  };
  className?: string;
}

const DIMENSION_META = [
  { key: 'intent', label: 'Ý Định', icon: Brain, color: 'text-purple-500' },
  { key: 'depth', label: 'Độ Sâu', icon: TrendingUp, color: 'text-blue-500' },
  { key: 'impact', label: 'Ảnh Hưởng', icon: Sparkles, color: 'text-amber-500' },
  { key: 'consistency', label: 'Đều Đặn', icon: Shield, color: 'text-green-500' },
  { key: 'trust_factor', label: 'Tin Cậy', icon: Heart, color: 'text-red-500' },
] as const;

export const PPLPv2ScoreCard = ({
  lightScoreV2,
  pillarBreakdown,
  dimensions,
  className,
}: PPLPv2ScoreCardProps) => {
  const level = getLightLevelV2(lightScoreV2);

  return (
    <Card className={cn("border-border/50 bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {level.emoji} Light Score v2.0
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs bg-gradient-to-r text-white border-0", level.color)}>
            {level.label}
          </Badge>
        </div>
        <motion.div
          key={lightScoreV2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          {lightScoreV2.toLocaleString()}
          <span className="text-xs text-muted-foreground font-normal ml-1">∞</span>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 5 Pillars */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">5 TRỤ CỘT ÁNH SÁNG</h4>
          <div className="space-y-2">
            {PILLAR_V2_LIST.map(pillarId => {
              const config = PILLAR_V2_CONFIGS[pillarId];
              const value = pillarBreakdown?.[pillarId] ?? 0;
              return (
                <div key={pillarId} className="flex items-center gap-2">
                  <span className="text-sm w-5">{config.emoji}</span>
                  <span className="text-xs text-muted-foreground w-16 truncate">{config.labelVi}</span>
                  <div className="flex-1">
                    <Progress value={value * 100} className="h-1.5" />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">{(value * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dimensions breakdown */}
        {dimensions && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">CHIỀU ĐO GIÁ TRỊ</h4>
            <div className="grid grid-cols-5 gap-1">
              {DIMENSION_META.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="text-center">
                  <Icon className={cn("h-3.5 w-3.5 mx-auto mb-0.5", color)} />
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                  <div className="text-xs font-semibold">
                    {((dimensions[key as keyof typeof dimensions] || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level progression */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Hiện tại: {level.label}</span>
            {level.maxScore && (
              <span>Tiếp theo: {level.maxScore + 1} điểm</span>
            )}
          </div>
          {level.maxScore && (
            <Progress
              value={((lightScoreV2 - level.minScore) / (level.maxScore - level.minScore)) * 100}
              className="h-1 mt-1"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
