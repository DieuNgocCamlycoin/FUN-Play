/**
 * Parameter Overrides — runtime tuning layer
 * Loads admin overrides from `parameter_overrides` table and merges with v1 defaults.
 * Cached 60s to avoid hammering DB.
 */
import { supabase } from '@/integrations/supabase/client';

export interface ParameterOverride {
  id: string;
  param_type: string;
  param_key: string;
  override_min: number | null;
  override_max: number | null;
  override_default: number | null;
  reason: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

let cache: { data: ParameterOverride[]; ts: number } | null = null;
const TTL_MS = 60_000;

export async function loadOverrides(force = false): Promise<ParameterOverride[]> {
  if (!force && cache && Date.now() - cache.ts < TTL_MS) return cache.data;

  const { data, error } = await supabase
    .from('parameter_overrides')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    console.error('[parameter-overrides] load failed:', error);
    return cache?.data ?? [];
  }

  cache = { data: (data ?? []) as ParameterOverride[], ts: Date.now() };
  return cache.data;
}

/** Find an override for a specific param. Returns null if none. */
export function findOverride(
  overrides: ParameterOverride[],
  type: string,
  key: string,
): ParameterOverride | null {
  return overrides.find(o => o.param_type === type && o.param_key === key) ?? null;
}

/** Apply override to a default value (returns override if present, else default). */
export function applyOverride(
  overrides: ParameterOverride[],
  type: string,
  key: string,
  defaultValue: number,
): number {
  const ov = findOverride(overrides, type, key);
  return ov?.override_default ?? defaultValue;
}

export function clearOverrideCache() {
  cache = null;
}
