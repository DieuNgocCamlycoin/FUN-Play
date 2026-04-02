/**
 * useAttesterSigning - Hook for GOV Attester to sign PPLP mint requests
 * Validates attester identity against BOTH database (gov_attesters table) and hardcoded fallback config.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useAuth } from '@/hooks/useAuth';
import { useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import {
  getGroupForAddress as getGroupFromConfig,
  getAttesterInfo as getAttesterInfoFromConfig,
  REQUIRED_GROUPS,
  type GovGroupName,
} from '@/lib/fun-money/pplp-multisig-config';
import { getEip712Domain, PPLP_TYPES, createActionHash } from '@/lib/fun-money/eip712-signer';
import { CONTRACT_ACTION } from '@/lib/fun-money/contract-helpers';
import type { PPLPMintRequest, MultisigSignatures } from '@/lib/fun-money/pplp-multisig-types';

interface AttesterIdentity {
  group: GovGroupName;
  name: string;
  groupLabel: string;
  source: 'database' | 'config';
}

export function useAttesterSigning() {
  const { address: walletAddress, isConnected } = useWalletContext();
  const { user } = useAuth();
  const { data: walletClient } = useWalletClient();
  const [pendingRequests, setPendingRequests] = useState<PPLPMintRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);
  const [attesterIdentity, setAttesterIdentity] = useState<AttesterIdentity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [profileWallet, setProfileWallet] = useState<string | null>(null);

  // Fetch profile wallet as fallback
  useEffect(() => {
    if (!user?.id) { setProfileWallet(null); return; }
    supabase.from('profiles').select('wallet_address').eq('id', user.id).single()
      .then(({ data }) => setProfileWallet(data?.wallet_address ?? null));
  }, [user?.id]);

  // Use live wallet if connected, otherwise fallback to profile wallet
  const address = walletAddress || profileWallet;
  
  console.log('[AttesterSigning] walletAddress:', walletAddress, 'isConnected:', isConnected, 'profileWallet:', profileWallet, 'resolved address:', address);

  // Resolve attester identity from DB first, then fallback to hardcoded config
  useEffect(() => {
    if (!address) {
      setAttesterIdentity(null);
      return;
    }

    const resolveIdentity = async () => {
      setIdentityLoading(true);
      try {
        // 1. Check database first
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
          return;
        }

        // 2. Fallback to hardcoded config
        const configInfo = getAttesterInfoFromConfig(address);
        if (configInfo) {
          setAttesterIdentity({
            group: configInfo.group,
            name: configInfo.name,
            groupLabel: configInfo.groupLabel,
            source: 'config',
          });
          return;
        }

        setAttesterIdentity(null);
      } catch {
        // Fallback to config on any error
        const configInfo = getAttesterInfoFromConfig(address);
        if (configInfo) {
          setAttesterIdentity({
            group: configInfo.group,
            name: configInfo.name,
            groupLabel: configInfo.groupLabel,
            source: 'config',
          });
        } else {
          setAttesterIdentity(null);
        }
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
        .select('*, profiles:user_id(display_name, username)')
        .in('status', ['pending_sig', 'signing'])
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Flatten profile info into each request
        const enriched = data.map((r: any) => ({
          ...r,
          user_display_name: r.profiles?.display_name || r.profiles?.username || null,
        }));
        setPendingRequests(enriched as unknown as PPLPMintRequest[]);
      }
    } finally {
      setLoading(false);
    }
  }, [isAttester]);

  // Realtime subscription
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

  // Sign a request
  const signRequest = useCallback(async (request: PPLPMintRequest) => {
    if (!walletClient || !address || !myGroup || !attesterIdentity) {
      throw new Error('Wallet not connected or not an attester');
    }

    // Check if already signed by this group
    const sigs = (request.multisig_signatures || {}) as MultisigSignatures;
    if (sigs[myGroup]) {
      throw new Error(`Nhóm ${myGroup.toUpperCase()} đã ký request này rồi`);
    }

    setSigning(request.id);
    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      // Build EIP-712 typed data
      const actionHash = createActionHash(CONTRACT_ACTION);
      const domain = getEip712Domain();

      const message = {
        user: request.recipient_address,
        actionHash,
        amount: request.amount_wei,
        evidenceHash: request.evidence_hash || '0x' + '0'.repeat(64),
        nonce: request.nonce || '0',
      };

      const signature = await signer.signTypedData(domain, PPLP_TYPES, message);

      // Update signatures in DB
      const updatedSigs: MultisigSignatures = {
        ...sigs,
        [myGroup]: {
          signer: address,
          signature,
          signed_at: new Date().toISOString(),
          signer_name: attesterIdentity.name,
        },
      };

      const completedGroups = REQUIRED_GROUPS.filter(g => updatedSigs[g]);
      const allSigned = completedGroups.length === REQUIRED_GROUPS.length;
      const newStatus = allSigned ? 'signed' : 'signing';

      const { error } = await supabase
        .from('pplp_mint_requests')
        .update({
          multisig_signatures: updatedSigs as any,
          multisig_completed_groups: completedGroups,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      await loadRequests();
      return { success: true, status: newStatus };
    } finally {
      setSigning(null);
    }
  }, [walletClient, address, myGroup, attesterIdentity, loadRequests]);

  return {
    pendingRequests,
    signRequest,
    myGroup,
    myName: attesterIdentity?.name || null,
    groupLabel: attesterIdentity?.groupLabel || null,
    isAttester,
    loading: loading || identityLoading,
    signing,
    refresh: loadRequests,
  };
}
