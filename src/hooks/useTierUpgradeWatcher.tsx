/**
 * useTierUpgradeWatcher — listens for trust_profile.tier changes and fires confetti + toast.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TrustTier } from '@/lib/identity/trust-tier';
import { TRUST_TIER_RANGES } from '@/lib/identity/trust-tier';

const TIER_ORDER: TrustTier[] = ['T0', 'T1', 'T2', 'T3', 'T4'];

export function useTierUpgradeWatcher() {
  const { user } = useAuth();
  const currentTierRef = useRef<TrustTier | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Seed current tier
    supabase.from('trust_profile').select('tier').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data?.tier) currentTierRef.current = data.tier as TrustTier;
    });

    const channel = supabase
      .channel(`trust-tier-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trust_profile', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newTier = (payload.new as { tier?: TrustTier })?.tier;
          const prev = currentTierRef.current;
          if (!newTier || !prev) {
            currentTierRef.current = newTier ?? prev;
            return;
          }
          const prevIdx = TIER_ORDER.indexOf(prev);
          const nextIdx = TIER_ORDER.indexOf(newTier);
          if (nextIdx > prevIdx) {
            const label = TRUST_TIER_RANGES[newTier].label;
            toast.success(`🎉 Trust Tier ${prev} → ${newTier} (${label})`, {
              description: 'Quyền hạn mới đã được mở khoá. Xem chi tiết tại /identity.',
              duration: 6000,
            });
            // Log event (best-effort, ignore failure)
            void supabase.from('identity_events').insert({
              user_id: user.id,
              event_type: 'tier_upgrade',
              payload: { from: prev, to: newTier },
            });
          }
          currentTierRef.current = newTier;
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);
}
