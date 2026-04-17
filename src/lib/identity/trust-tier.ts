/**
 * Trust Tier Mapping — Identity + Trust Layer Spec v1.0
 * T0 Unknown → T4 Core
 */

export type TrustTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';

export const TRUST_TIER_RANGES: Record<TrustTier, { min: number; max: number; label: string }> = {
  T0: { min: 0.30, max: 0.59, label: 'Unknown' },
  T1: { min: 0.60, max: 0.79, label: 'Basic' },
  T2: { min: 0.80, max: 0.99, label: 'Verified' },
  T3: { min: 1.00, max: 1.24, label: 'Trusted' },
  T4: { min: 1.25, max: 1.50, label: 'Core' },
};

export function tcToTier(tc: number): TrustTier {
  if (tc >= 1.25) return 'T4';
  if (tc >= 1.00) return 'T3';
  if (tc >= 0.80) return 'T2';
  if (tc >= 0.60) return 'T1';
  return 'T0';
}

export function tierLabel(tier: TrustTier): string {
  return TRUST_TIER_RANGES[tier].label;
}

export function tierToColor(tier: TrustTier): string {
  switch (tier) {
    case 'T4': return 'hsl(var(--primary))';
    case 'T3': return 'hsl(var(--accent))';
    case 'T2': return 'hsl(var(--secondary))';
    case 'T1': return 'hsl(var(--muted-foreground))';
    default: return 'hsl(var(--muted))';
  }
}
