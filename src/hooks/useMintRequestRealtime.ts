/**
 * useMintRequestRealtime Hook
 * Realtime subscription for mint_requests table changes
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface MintRequestPayload {
  id: string;
  user_id: string;
  status: string;
  calculated_amount_formatted: string | null;
  tx_hash: string | null;
  decision_reason: string | null;
  action_type: string;
}

interface UseMintRequestRealtimeOptions {
  userId: string | undefined;
  onUpdate: () => void;
  enabled?: boolean;
}

interface UseMintRequestRealtimeReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastUpdate: Date | null;
}

// Status transition notifications
const STATUS_NOTIFICATIONS: Record<string, Record<string, { type: 'success' | 'warning' | 'error' | 'info'; message: string; confetti?: boolean }>> = {
  pending: {
    approved: { type: 'success', message: 'Request đã được duyệt! Sẵn sàng mint.' },
    rejected: { type: 'warning', message: 'Request bị từ chối' },
  },
  approved: {
    minted: { type: 'success', message: 'FUN tokens đã mint thành công!', confetti: true },
    failed: { type: 'error', message: 'Mint thất bại' },
    rejected: { type: 'warning', message: 'Request bị từ chối' },
  },
};

// Trigger confetti animation
const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

export function useMintRequestRealtime({
  userId,
  onUpdate,
  enabled = true,
}: UseMintRequestRealtimeOptions): UseMintRequestRealtimeReturn {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced update handler
  const handleUpdate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setLastUpdate(new Date());
      onUpdate();
    }, 300);
  }, [onUpdate]);

  // Handle status change notifications
  const handleStatusChange = useCallback((
    oldStatus: string | undefined,
    newStatus: string,
    payload: MintRequestPayload
  ) => {
    if (!oldStatus || oldStatus === newStatus) return;

    const notification = STATUS_NOTIFICATIONS[oldStatus]?.[newStatus];
    
    if (notification) {
      let message = notification.message;
      
      // Add reason if rejected
      if (newStatus === 'rejected' && payload.decision_reason) {
        message = `${notification.message}: ${payload.decision_reason}`;
      }
      
      // Add amount if minted
      if (newStatus === 'minted' && payload.calculated_amount_formatted) {
        message = `${notification.message} (${payload.calculated_amount_formatted} FUN)`;
      }

      // Show toast
      switch (notification.type) {
        case 'success':
          toast.success(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'error':
          toast.error(message);
          break;
        default:
          toast.info(message);
      }

      // Trigger confetti if needed
      if (notification.confetti) {
        triggerConfetti();
      }
    }

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('fun-money-update', {
      detail: {
        requestId: payload.id,
        oldStatus,
        newStatus,
        amount: payload.calculated_amount_formatted,
        txHash: payload.tx_hash,
      },
    }));
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    if (!enabled || !userId) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    // Create channel with unique name
    const channelName = `mint_requests_${userId}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mint_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<MintRequestPayload>) => {
          console.log('[Realtime] mint_requests change:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            toast.info('Request mới đã được tạo');
            handleUpdate();
          } else if (payload.eventType === 'UPDATE') {
            const oldRecord = payload.old as MintRequestPayload | undefined;
            const newRecord = payload.new as MintRequestPayload;
            
            handleStatusChange(oldRecord?.status, newRecord.status, newRecord);
            handleUpdate();
          } else if (payload.eventType === 'DELETE') {
            handleUpdate();
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('connecting');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, handleUpdate, handleStatusChange]);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    lastUpdate,
  };
}
