/**
 * useAttesterSigning — Hook for authorized minter identity check
 * SDK v2.0 — No more EIP-712 multisig, just checks if wallet is authorized minter.
 * Kept for backward compatibility with UI components that check attester status.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useAuth } from '@/hooks/useAuth';
import type { GovGroupName } from '@/lib/fun-money/gov-config';
import type { MintSubmitRequest } from '@/hooks/useMintSubmit';

interface AttesterIdentity {
  group: GovGroupName;
  name: string;
  groupLabel: string;
  source: 'database' | 'config';
}

export function useAttesterSigning() {
  const { address: walletAddress, isConnected } = useWalletContext();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<MintSubmitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [attesterIdentity, setAttesterIdentity] = useState<AttesterIdentity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [profileWallet, setProfileWallet] = useState<string | null>(null);

  // Fetch profile wallet as fallback
  useEffect(() => {
    if (!user?.id) { setProfileWallet(null); return; }
    supabase.from('profiles').select('wallet_address').eq('id', user.id).single()
      .then(({ data }) => setProfileWallet(data?.wallet_address ?? null));
  }, [user?.id]);

  const address = walletAddress || profileWallet;

  // Resolve attester identity from DB
  useEffect(() => {
    if (!address) {
      setAttesterIdentity(null);
      return;
    }

    const resolveIdentity = async () => {
      setIdentityLoading(true);
      try {
        const { data, error } = await supabase
          .from('gov_attesters')
          .select('gov_group, name, is_active')
          .ilike('wallet_address', address)
          .eq('is_active', true)
          .single();

        if (!error && data) {
          const groupEmojis: Record<string, string> = { will: '💪', wisdom: '🌟', love: '❤️' };
          setAttesterIdentity({
            group: data.gov_group as GovGroupName,
            name: data.name,
            groupLabel: `${groupEmojis[data.gov_group] || '🔹'} ${data.gov_group.toUpperCase()}`,
            source: 'database',
          });
        } else {
          setAttesterIdentity(null);
        }
      } catch {
        setAttesterIdentity(null);
      } finally {
        setIdentityLoading(false);
      }
    };

    resolveIdentity();
  }, [address]);

  const myGroup = attesterIdentity?.group ?? null;
  const isAttester = myGroup !== null;

  // Load pending requests
  const loadRequests = useCallback(async () => {
    if (!isAttester) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pplp_mint_requests')
        .select('*')
        .in('status', ['pending_sig', 'signing', 'signed'])
        .gt('amount', 0)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPendingRequests(data as unknown as MintSubmitRequest[]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAttester]);

  useEffect(() => {
    if (!isAttester) return;
    loadRequests();

    const channel = supabase
      .channel('pplp-mint-requests-attester')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pplp_mint_requests',
      }, () => {
        loadRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAttester, loadRequests]);

  return {
    pendingRequests,
    myGroup,
    myName: attesterIdentity?.name || null,
    groupLabel: attesterIdentity?.groupLabel || null,
    isAttester,
    loading: loading || identityLoading,
    refresh: loadRequests,
  };
}
