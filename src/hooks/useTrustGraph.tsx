import { useEffect, useState, useCallback } from 'react';
import { getTrustGraphStats, hasVouchedFor, type TrustGraphStats } from '@/lib/identity/trust-graph';
import { useAuth } from './useAuth';

export function useTrustGraph(userId: string | undefined) {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrustGraphStats | null>(null);
  const [vouched, setVouched] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [s, v] = await Promise.all([
        getTrustGraphStats(userId),
        user && user.id !== userId ? hasVouchedFor(userId) : Promise.resolve(false),
      ]);
      setStats(s);
      setVouched(v);
    } catch (e) {
      console.error('useTrustGraph load error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => { reload(); }, [reload]);

  return { stats, vouched, loading, reload, isOwn: user?.id === userId };
}
