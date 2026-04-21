/**
 * useAttesterSigning — v2 (lockWithPPLP pipeline)
 * Reads from pplp_mint_requests_v2 and lets the connected attester wallet
 * sign EIP-712 PureLoveProof, then submits via pplp-mint-add-signature.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWalletClient } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { BrowserProvider } from 'ethers';
import {
  PURE_LOVE_PROOF_DOMAIN,
  PURE_LOVE_PROOF_TYPES,
  signPureLoveProof,
} from '@/lib/fun-money/lockWithPPLP-eip712';

export interface MintRequestV2 {
  id: string;
  user_id: string;
  recipient_address: string;
  action_name: string;
  action_hash: string;
  amount_wei: string;
  amount_display: number;
  evidence_hash: string;
  nonce: string;
  digest: string;
  signatures: Array<{ attester: string; signature: string }>;
  signatures_count: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  deadline: number;
}

export function useAttesterSigning() {
  const { address: walletAddress } = useWalletContext();
  const { data: walletClient } = useWalletClient();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<MintRequestV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSigning, setIsSigning] = useState<string | null>(null);
  const [profileWallet, setProfileWallet] = useState<string | null>(null);
  const [attesterInfo, setAttesterInfo] = useState<{ name: string; group: string } | null>(null);

  // Profile wallet fallback
  useEffect(() => {
    if (!user?.id) { setProfileWallet(null); return; }
    supabase.from('profiles').select('wallet_address').eq('id', user.id).single()
      .then(({ data }) => setProfileWallet(data?.wallet_address ?? null));
  }, [user?.id]);

  const address = walletAddress || profileWallet;

  // Resolve attester identity from gov_attesters
  useEffect(() => {
    if (!address) { setAttesterInfo(null); return; }
    supabase
      .from('gov_attesters')
      .select('name, gov_group, is_active')
      .ilike('wallet_address', address)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setAttesterInfo(data ? { name: data.name, group: data.gov_group } : null);
      });
  }, [address]);

  const isAttester = attesterInfo !== null;

  // Load pending v2 requests
  const loadRequests = useCallback(async () => {
    if (!isAttester) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('pplp_mint_requests_v2')
        .select('*')
        .in('status', ['pending_sig', 'signed'])
        .order('created_at', { ascending: true });
      setPendingRequests((data ?? []) as unknown as MintRequestV2[]);
    } finally {
      setLoading(false);
    }
  }, [isAttester]);

  useEffect(() => {
    if (!isAttester) return;
    loadRequests();
    const channel = supabase
      .channel('pplp_mint_requests_v2-attester')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pplp_mint_requests_v2' },
        () => loadRequests(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAttester, loadRequests]);

  /** Sign one request via connected wallet, then submit to edge function */
  const signRequest = useCallback(async (req: MintRequestV2) => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    if (req.signatures.some(s => s.attester.toLowerCase() === address.toLowerCase())) {
      throw new Error('Bạn đã ký request này rồi');
    }
    setIsSigning(req.id);
    try {
      const provider = new BrowserProvider(walletClient.transport as any);
      const signer = await provider.getSigner();
      const message = {
        user: req.recipient_address,
        actionHash: req.action_hash,
        amount: req.amount_wei.toString(),
        evidenceHash: req.evidence_hash,
        nonce: req.nonce.toString(),
      };
      const signature = await signPureLoveProof(signer, message);
      const { data, error } = await supabase.functions.invoke('pplp-mint-add-signature', {
        body: { request_id: req.id, attester_address: address, signature },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'add-signature failed');
      await loadRequests();
      return data;
    } finally {
      setIsSigning(null);
    }
  }, [walletClient, address, loadRequests]);

  return {
    pendingRequests,
    isAttester,
    myName: attesterInfo?.name ?? null,
    myGroup: attesterInfo?.group ?? null,
    groupLabel: attesterInfo
      ? `${({ will: '💪', wisdom: '🌟', love: '❤️' } as Record<string, string>)[attesterInfo.group] ?? '🔹'} ${attesterInfo.group.toUpperCase()}`
      : null,
    loading,
    isSigning,
    signRequest,
    refresh: loadRequests,
    domain: PURE_LOVE_PROOF_DOMAIN,
    types: PURE_LOVE_PROOF_TYPES,
  };
}
