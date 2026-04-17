/**
 * Stability Index — measures Light Score volatility over 30 days.
 * Used in mint formula: stable users get bonus, volatile users get reduction.
 *
 * Range: 0.5 (highly volatile) → 1.2 (very stable)
 * Default: 1.0 (neutral / insufficient data)
 */
import { supabase } from '@/integrations/supabase/client';

export interface StabilitySnapshot {
  user_id: string;
  snapshot_date: string;
  stability_index: number;
  variance: number;
  mean_ls_30d: number;
  std_dev: number;
  data_points: number;
  computed_at: string;
}

const STABILITY_FLOOR = 0.5;
const STABILITY_CEILING = 1.2;
const NEUTRAL = 1.0;

/** Fetch latest stability snapshot for a user (today or most recent). */
export async function getStabilityIndex(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('stability_snapshots')
    .select('stability_index')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return NEUTRAL;
  return clamp(Number(data.stability_index) || NEUTRAL);
}

/** Trigger DB recompute (calls SECURITY DEFINER function). Returns new index. */
export async function recomputeStabilityIndex(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('compute_stability_index', { _user_id: userId });
  if (error) {
    console.error('[stability] recompute failed:', error);
    return NEUTRAL;
  }
  return clamp(Number(data) || NEUTRAL);
}

export async function getStabilityHistory(userId: string, days = 30): Promise<StabilitySnapshot[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('stability_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('snapshot_date', since)
    .order('snapshot_date', { ascending: true });
  return (data ?? []) as StabilitySnapshot[];
}

function clamp(v: number): number {
  return Math.max(STABILITY_FLOOR, Math.min(STABILITY_CEILING, v));
}

export const STABILITY_BOUNDS = { floor: STABILITY_FLOOR, ceiling: STABILITY_CEILING, neutral: NEUTRAL };
