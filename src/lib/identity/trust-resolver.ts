/**
 * Trust Profile Resolver — fetch live TC from trust_profile table for PPLP pipeline
 * Replaces static user_trust_tier in ContextTag with dynamic TC from Identity+Trust Layer v1.0
 */
import { supabase } from '@/integrations/supabase/client';
import type { TrustTier } from '@/lib/identity/trust-tier';

export interface LiveTrustData {
  tc: number;
  tier: TrustTier;
  sybil_risk: number;
  fraud_risk: number;
}

const DEFAULT_TRUST: LiveTrustData = { tc: 0.5, tier: 'T0', sybil_risk: 0, fraud_risk: 0 };

/**
 * Resolve live TC from trust_profile table.
 * Falls back to default low-trust if not found.
 */
export async function resolveLiveTrust(userId: string): Promise<LiveTrustData> {
  if (!userId) return DEFAULT_TRUST;

  const { data, error } = await supabase
    .from('trust_profile')
    .select('tc, tier, sybil_risk, fraud_risk')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_TRUST;

  return {
    tc: Number(data.tc) || 0.5,
    tier: (data.tier as TrustTier) || 'T0',
    sybil_risk: Number(data.sybil_risk) || 0,
    fraud_risk: Number(data.fraud_risk) || 0,
  };
}

/**
 * Map TrustTier to PPLP engine's user_trust_tier identifier
 * (PPLP engine v2.5 uses string keys understood by getTrustConfidence)
 */
export function tierToPPLPKey(tier: TrustTier): string {
  // Identity+Trust Layer v1.0 5-tier IDs: T0..T4 are accepted directly per pplp-engine-v25 ContextTag comment
  return tier;
}
