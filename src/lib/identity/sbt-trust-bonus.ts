/**
 * SBT Trust Bonus — aggregate active SBT trust_weight into a Light Score multiplier bonus.
 * Cap at +0.15 per spec v1.0 to prevent multiplier inflation.
 */
import { supabase } from '@/integrations/supabase/client';

export const SBT_BONUS_CAP = 0.15;

/**
 * Sum trust_weight of all active SBTs and apply cap.
 * Returns 0 if user has none.
 */
export async function getSbtTrustBonus(userId: string): Promise<number> {
  if (!userId) return 0;
  const { data, error } = await supabase
    .from('sbt_registry')
    .select('trust_weight')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error || !data) return 0;
  const sum = data.reduce((acc, r: any) => acc + (Number(r.trust_weight) || 0), 0);
  return Math.min(SBT_BONUS_CAP, Math.max(0, sum));
}

/**
 * Apply SBT bonus to a base multiplier (e.g. trust_weight in PPLP v2.5).
 * Multiplier becomes base * (1 + bonus).
 */
export function applySbtBonus(baseMultiplier: number, bonus: number): number {
  const safeBonus = Math.min(SBT_BONUS_CAP, Math.max(0, bonus));
  return baseMultiplier * (1 + safeBonus);
}
