/**
 * useTrustPermission — check if current user is allowed to perform an action
 * based on Identity+Trust Layer v1.0 permission matrix.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { checkPermission } from '@/lib/identity/permission-matrix';
import type { DIDLevel } from '@/lib/identity/did-registry';
import type { TrustTier } from '@/lib/identity/trust-tier';

export interface TrustPermissionResult {
  allowed: boolean;
  reason?: string;
  loading: boolean;
  did_level: DIDLevel;
  tc: number;
  tier: TrustTier;
  has_sbt: boolean;
}

export function useTrustPermission(action: string): TrustPermissionResult {
  const { user } = useAuth();
  const [result, setResult] = useState<TrustPermissionResult>({
    allowed: false, loading: true, did_level: 'L0', tc: 0.3, tier: 'T0', has_sbt: false,
  });

  useEffect(() => {
    if (!user?.id) {
      setResult(r => ({ ...r, loading: false, allowed: false, reason: 'not_authenticated' }));
      return;
    }
    let cancelled = false;
    (async () => {
      const [didRes, trustRes, sbtRes] = await Promise.all([
        supabase.from('did_registry').select('level').eq('user_id', user.id).maybeSingle(),
        supabase.from('trust_profile').select('tc, tier, sybil_risk').eq('user_id', user.id).maybeSingle(),
        supabase.from('sbt_registry').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'active'),
      ]);
      if (cancelled) return;
      const did_level = (didRes.data?.level as DIDLevel) ?? 'L0';
      const tc = Number(trustRes.data?.tc) || 0.3;
      const tier = (trustRes.data?.tier as TrustTier) ?? 'T0';
      const sybil_risk = Number(trustRes.data?.sybil_risk) || 0;
      const has_sbt = (sbtRes.count ?? 0) > 0;
      const check = checkPermission(action, { did_level, tc, has_sbt, sybil_risk });
      setResult({
        allowed: check.allowed,
        reason: check.reason,
        loading: false,
        did_level, tc, tier, has_sbt,
      });
    })();
    return () => { cancelled = true; };
  }, [user?.id, action]);

  return result;
}
