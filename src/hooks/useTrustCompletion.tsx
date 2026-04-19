/**
 * useTrustCompletion — đếm guardian đã hoàn tất + tổng quan trust setup
 * Dùng để tự ẩn các CTA xác minh khi user đã có ≥2 guardian.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const GUARDIAN_THRESHOLD = 2;

export interface TrustCompletion {
  loading: boolean;
  guardianCount: number;
  isComplete: boolean; // ≥2 guardian
  hasPrimary: boolean;
  hasWallet: boolean;
  refresh: () => void;
}

export function useTrustCompletion(userId?: string): TrustCompletion {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  const [state, setState] = useState<Omit<TrustCompletion, 'refresh'>>({
    loading: true, guardianCount: 0, isComplete: false, hasPrimary: false, hasWallet: false,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!targetId) { setState(s => ({ ...s, loading: false })); return; }
    let cancelled = false;
    (async () => {
      const [{ data: profile }, { data: guardians }] = await Promise.all([
        supabase.from('profiles').select('wallet_address').eq('id', targetId).maybeSingle(),
        supabase.from('recovery_log')
          .select('id', { count: 'exact', head: false })
          .eq('user_id', targetId).eq('recovery_layer', 'guardian')
          .in('status', ['completed', 'pending']),
      ]);
      if (cancelled) return;
      const count = guardians?.length ?? 0;
      setState({
        loading: false,
        guardianCount: count,
        isComplete: count >= GUARDIAN_THRESHOLD,
        hasPrimary: !!user?.email_confirmed_at || !!user?.phone_confirmed_at,
        hasWallet: !!profile?.wallet_address,
      });
    })();
    return () => { cancelled = true; };
  }, [targetId, tick, user?.email_confirmed_at, user?.phone_confirmed_at]);

  return { ...state, refresh: () => setTick(t => t + 1) };
}
