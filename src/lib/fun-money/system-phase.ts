/**
 * System Phase resolver — dynamic Early/Growth/Mature
 * Reads from `system_phase_state` table, falls back to 'early'.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  TLS_PHASE_WEIGHTS,
  type SystemPhase,
  type PhaseWeights,
} from './light-score-params-v1';

let phaseCache: { phase: SystemPhase; ts: number } | null = null;
const TTL_MS = 5 * 60_000; // 5 min

export async function getCurrentPhase(force = false): Promise<SystemPhase> {
  if (!force && phaseCache && Date.now() - phaseCache.ts < TTL_MS) return phaseCache.phase;

  const { data, error } = await supabase
    .from('system_phase_state')
    .select('current_phase')
    .eq('is_current', true)
    .maybeSingle();

  if (error || !data) {
    console.warn('[system-phase] fallback to early:', error?.message);
    return 'early';
  }

  const phase = data.current_phase as SystemPhase;
  phaseCache = { phase, ts: Date.now() };
  return phase;
}

export async function getCurrentPhaseWeights(): Promise<PhaseWeights> {
  const phase = await getCurrentPhase();
  return TLS_PHASE_WEIGHTS[phase];
}

export interface PhaseStateRow {
  id: string;
  current_phase: SystemPhase;
  previous_phase: SystemPhase | null;
  switched_at: string;
  switch_reason: string | null;
  kpi_snapshot: Record<string, number | string>;
  is_current: boolean;
  auto_switch_enabled: boolean;
}

export async function getPhaseHistory(limit = 20): Promise<PhaseStateRow[]> {
  const { data } = await supabase
    .from('system_phase_state')
    .select('*')
    .order('switched_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as PhaseStateRow[];
}

export function clearPhaseCache() {
  phaseCache = null;
}
