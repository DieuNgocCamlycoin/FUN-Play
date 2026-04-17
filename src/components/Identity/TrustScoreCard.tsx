import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { TRUST_TIER_RANGES, tcToTier, type TrustTier } from '@/lib/identity/trust-tier';

interface TrustProfile {
  tc: number;
  trust_tier: TrustTier;
  vs: number; bs: number; ss: number; os: number; hs: number; rf: number;
  sybil_risk: number;
  fraud_risk: number;
}

interface Props {
  profile: TrustProfile | null;
  loading?: boolean;
}

const TIER_VARIANT: Record<TrustTier, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  T0: 'outline', T1: 'outline', T2: 'secondary', T3: 'default', T4: 'default',
};

export function TrustScoreCard({ profile, loading }: Props) {
  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-40 animate-pulse bg-muted rounded" /></CardContent></Card>;
  }

  const tc = profile?.tc ?? 0.3;
  const tier = profile?.trust_tier ?? tcToTier(tc);
  const range = TRUST_TIER_RANGES[tier];
  const tcPct = Math.min(100, (tc / 1.5) * 100);

  const breakdown = [
    { label: 'Verification', value: profile?.vs ?? 0, weight: 0.30 },
    { label: 'Behavior', value: profile?.bs ?? 0, weight: 0.25 },
    { label: 'Social', value: profile?.ss ?? 0, weight: 0.15 },
    { label: 'On-chain', value: profile?.os ?? 0, weight: 0.20 },
    { label: 'History', value: profile?.hs ?? 0, weight: 0.10 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trust Confidence
        </CardTitle>
        <Badge variant={TIER_VARIANT[tier]} className="font-mono">{tier} • {range.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-3xl font-bold">{tc.toFixed(3)}</span>
            <span className="text-xs text-muted-foreground">range {range.min}–{range.max}</span>
          </div>
          <Progress value={tcPct} className="h-2" />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">TC = (0.30·VS + 0.25·BS + 0.15·SS + 0.20·OS + 0.10·HS) × RF</p>
          {breakdown.map(b => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-muted-foreground">{b.label}</span>
              <Progress value={b.value * 100} className="h-1.5 flex-1" />
              <span className="font-mono w-16 text-right">{b.value.toFixed(2)} × {b.weight}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs pt-1 border-t">
            <span className="w-24 text-muted-foreground">Risk Factor</span>
            <Progress value={(profile?.rf ?? 1) * 100} className="h-1.5 flex-1" />
            <span className="font-mono w-16 text-right">×{(profile?.rf ?? 1).toFixed(2)}</span>
          </div>
        </div>

        {(profile?.sybil_risk ?? 0) > 30 && (
          <div className="text-xs text-destructive flex items-center gap-2">
            ⚠ Sybil risk: {profile?.sybil_risk}/100
          </div>
        )}
      </CardContent>
    </Card>
  );
}
