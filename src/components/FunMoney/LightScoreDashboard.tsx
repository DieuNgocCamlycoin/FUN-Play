/**
 * LightScoreDashboard — 5-Pillar Radar Chart + Level Badge + Badges
 */

import { useAuth } from '@/hooks/useAuth';
import { useLightScorePillars } from '@/hooks/useLightScorePillars';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { PILLAR_CONFIGS, PILLAR_LIST, LIGHT_LEVELS, REPUTATION_BADGES, type PillarName } from '@/lib/fun-money/light-score-pillars';
import { checkBadgeEligibility } from '@/lib/fun-money/reputation-nft';
import { cn } from '@/lib/utils';

// ===== RADAR CHART (Pure SVG) =====

function RadarChart({ scores }: { scores: Record<PillarName, number> }) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 80;
  const levels = 5; // concentric rings

  const pillars = PILLAR_LIST;
  const angleStep = (2 * Math.PI) / pillars.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Concentric rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxRadius;
    const points = pillars.map((_, j) => {
      const angle = angleStep * j - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    });
    return points.join(' ');
  });

  // Axis lines
  const axes = pillars.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x2: center + maxRadius * Math.cos(angle),
      y2: center + maxRadius * Math.sin(angle),
    };
  });

  // Data polygon
  const dataPoints = pillars.map((p, i) => {
    const pt = getPoint(i, scores[p]);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // Labels
  const labels = pillars.map((p, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelR = maxRadius + 18;
    return {
      x: center + labelR * Math.cos(angle),
      y: center + labelR * Math.sin(angle),
      label: PILLAR_CONFIGS[p].emoji,
      score: scores[p],
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto">
      {/* Rings */}
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          opacity={0.5}
        />
      ))}

      {/* Axes */}
      {axes.map((axis, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={axis.x2}
          y2={axis.y2}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          opacity={0.3}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoints}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />

      {/* Data points */}
      {pillars.map((p, i) => {
        const pt = getPoint(i, scores[p]);
        return (
          <circle
            key={p}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill="hsl(var(--primary))"
          />
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <g key={i}>
          <text
            x={l.x}
            y={l.y - 4}
            textAnchor="middle"
            fontSize="14"
            className="fill-foreground"
          >
            {l.label}
          </text>
          <text
            x={l.x}
            y={l.y + 10}
            textAnchor="middle"
            fontSize="9"
            className="fill-muted-foreground"
            fontWeight="bold"
          >
            {l.score}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ===== LEVEL BADGE =====

function LevelBadge({ levelId, score }: { levelId: string; score: number }) {
  const level = LIGHT_LEVELS.find(l => l.id === levelId) || LIGHT_LEVELS[0];
  const nextLevel = LIGHT_LEVELS.find(l => l.minScore > score);
  const progress = nextLevel
    ? ((score - level.minScore) / (nextLevel.minScore - level.minScore)) * 100
    : 100;

  return (
    <div className="text-center space-y-2">
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r font-bold text-white text-lg",
        level.color
      )}>
        <span className="text-2xl">{level.emoji}</span>
        <span>{level.label}</span>
      </div>
      <div className="text-3xl font-black text-foreground">{score}</div>
      {nextLevel && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Còn {nextLevel.minScore - score} điểm → {nextLevel.emoji} {nextLevel.label}
          </p>
        </div>
      )}
    </div>
  );
}

// ===== PILLAR DETAIL ROW =====

function PillarRow({ pillar, score }: { pillar: PillarName; score: number }) {
  const config = PILLAR_CONFIGS[pillar];
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-8 text-center">{config.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-sm font-bold">{score}/100</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </div>
  );
}

// ===== MAIN DASHBOARD =====

export function LightScoreDashboard() {
  const { user } = useAuth();
  const { result, loading, error } = useLightScorePillars(user?.id);

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[240px]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10" />)}
        </div>
      </Card>
    );
  }

  if (error || !result) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>Chưa có dữ liệu Light Score. Hãy bắt đầu hoạt động để tích lũy điểm! 🌱</p>
      </Card>
    );
  }

  const { pillarScores, finalScore, level, riskPenalty, streakBonus } = result;

  // Check badges
  const earnedBadges = checkBadgeEligibility(
    pillarScores,
    0, // streakDays — simplified
    riskPenalty / 100,
    0, // walletAgeDays
    0, // accountAgeDays
  );

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">✨ Light Score — 5 Trụ Cột</h3>
        <Badge variant="outline" className="text-xs">
          Whitepaper v1
        </Badge>
      </div>

      {/* Level Badge + Score */}
      <LevelBadge levelId={level.id} score={finalScore} />

      {/* Radar Chart */}
      <RadarChart scores={pillarScores} />

      {/* Pillar Details */}
      <div className="space-y-3">
        {PILLAR_LIST.map(p => (
          <PillarRow key={p} pillar={p} score={pillarScores[p]} />
        ))}
      </div>

      {/* Modifiers */}
      <div className="flex flex-wrap gap-2 text-xs">
        {riskPenalty > 0 && (
          <Badge variant="destructive" className="text-xs">
            ⚠️ Risk Penalty: -{riskPenalty}
          </Badge>
        )}
        {streakBonus > 0 && (
          <Badge variant="secondary" className="text-xs">
            🔥 Streak Bonus: +{(streakBonus * 100).toFixed(0)}%
          </Badge>
        )}
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">🏅 Badges</h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map(badge => (
              <Badge key={badge.id} variant="outline" className="text-xs">
                {badge.emoji} {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* All Level Tiers */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">CẤP ĐỘ</h4>
        {LIGHT_LEVELS.map(l => (
          <div
            key={l.id}
            className={cn(
              "flex items-center gap-2 text-xs py-1 px-2 rounded",
              l.id === level.id && "bg-primary/10 font-bold"
            )}
          >
            <span>{l.emoji}</span>
            <span className="flex-1">{l.label}</span>
            <span className="text-muted-foreground">
              ≥ {l.minScore}
              {l.maxScore ? ` — ${l.maxScore}` : '+'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
