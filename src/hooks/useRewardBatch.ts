import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BatchAction {
  type: 'VIEW' | 'LIKE' | 'SHARE';
  videoId: string;
  timestamp: number;
  actualWatchTime?: number;
}

interface BatchResult {
  results: Array<{
    type: string;
    videoId: string;
    success: boolean;
    amount?: number;
    reason?: string;
  }>;
}

const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_QUEUE_SIZE = 10;

// Singleton queue shared across hook instances
let globalQueue: BatchAction[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let instanceCount = 0;

// Daily limit cache to avoid sending requests that will be rejected
const dailyLimitCache: Record<string, { counts: Record<string, number>; timestamp: number }> = {};
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

const HARD_LIMITS: Record<string, number> = {
  VIEW: 10,
  LIKE: 20,
  SHARE: 10,
};

function getCachedLimits(userId: string): Record<string, number> | null {
  const cached = dailyLimitCache[userId];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.counts;
  }
  return null;
}

function updateCachedLimit(userId: string, type: string) {
  if (!dailyLimitCache[userId]) {
    dailyLimitCache[userId] = { counts: {}, timestamp: Date.now() };
  }
  const key = `${type.toLowerCase()}_count`;
  dailyLimitCache[userId].counts[key] = (dailyLimitCache[userId].counts[key] || 0) + 1;
}

async function flushQueue(): Promise<BatchResult | null> {
  if (globalQueue.length === 0) return null;

  const actions = [...globalQueue];
  globalQueue = [];

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[RewardBatch] No session, dropping queued actions');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('batch-award-camly', {
      body: { actions }
    });

    if (error) {
      console.error('[RewardBatch] Flush error:', error);
      return null;
    }

    // Update cached limits from response
    if (data?.dailyCounts) {
      dailyLimitCache[session.user.id] = {
        counts: data.dailyCounts,
        timestamp: Date.now(),
      };
    }

    // Dispatch events for successful rewards
    if (data?.results) {
      for (const result of data.results) {
        if (result.success && result.amount) {
          window.dispatchEvent(new CustomEvent("camly-reward", {
            detail: { type: result.type, amount: result.amount, autoApproved: result.autoApproved }
          }));
        }
      }
    }

    return data as BatchResult;
  } catch (err) {
    console.error('[RewardBatch] Flush exception:', err);
    // Put actions back into queue on failure
    globalQueue = [...actions, ...globalQueue];
    return null;
  }
}

export const useRewardBatch = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    instanceCount++;
    mountedRef.current = true;

    // Start flush timer if first instance
    if (instanceCount === 1 && !flushTimer) {
      flushTimer = setInterval(() => {
        flushQueue();
      }, FLUSH_INTERVAL_MS);
    }

    // Flush on page unload
    const handleBeforeUnload = () => {
      if (globalQueue.length > 0) {
        // Use sendBeacon for reliability
        const session = JSON.parse(localStorage.getItem('sb-fzgjmvxtgrlwrluxdwjq-auth-token') || '{}');
        const accessToken = session?.access_token;
        if (accessToken) {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-award-camly`;
          const body = JSON.stringify({ actions: globalQueue });
          navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
          globalQueue = [];
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mountedRef.current = false;
      instanceCount--;
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (instanceCount === 0) {
        if (flushTimer) {
          clearInterval(flushTimer);
          flushTimer = null;
        }
        // Flush remaining on last unmount
        flushQueue();
      }
    };
  }, []);

  const enqueue = useCallback(async (
    type: 'VIEW' | 'LIKE' | 'SHARE',
    videoId: string,
    options?: { actualWatchTime?: number }
  ): Promise<boolean> => {
    // Check client-side cached limits first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const cached = getCachedLimits(session.user.id);
    if (cached) {
      const countKey = `${type.toLowerCase()}_count`;
      const currentCount = cached[countKey] || 0;
      const limit = HARD_LIMITS[type] || 999;
      if (currentCount >= limit) {
        console.log(`[RewardBatch] Client-side limit reached for ${type}: ${currentCount}/${limit}`);
        return false;
      }
    }

    const action: BatchAction = {
      type,
      videoId,
      timestamp: Date.now(),
      actualWatchTime: options?.actualWatchTime,
    };

    globalQueue.push(action);
    updateCachedLimit(session.user.id, type);

    // Auto-flush when queue is full
    if (globalQueue.length >= MAX_QUEUE_SIZE) {
      flushQueue();
    }

    return true;
  }, []);

  const flush = useCallback(() => flushQueue(), []);

  return { enqueue, flush };
};
