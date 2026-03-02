/**
 * useAttesterSigning - Hook for GOV Attester to sign PPLP mint requests
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import {
  getGroupForAddress,
  getAttesterInfo,
  REQUIRED_GROUPS,
  type GovGroupName,
} from '@/lib/fun-money/pplp-multisig-config';
import { getEip712Domain, PPLP_TYPES, createActionHash } from '@/lib/fun-money/eip712-signer';
import { CONTRACT_ACTION } from '@/lib/fun-money/contract-helpers';
import type { PPLPMintRequest, MultisigSignatures } from '@/lib/fun-money/pplp-multisig-types';

export function useAttesterSigning() {
  const { address, isConnected } = useWalletContext();
  const { data: walletClient } = useWalletClient();
  const [pendingRequests, setPendingRequests] = useState<PPLPMintRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState<string | null>(null);

  const myGroup = address ? getGroupForAddress(address) : null;
  const attesterInfo = address ? getAttesterInfo(address) : null;
  const isAttester = myGroup !== null;

  // Load pending requests
  const loadRequests = useCallback(async () => {
    if (!isAttester) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pplp_mint_requests')
        .select('*')
        .in('status', ['pending_sig', 'signing'])
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPendingRequests(data as unknown as PPLPMintRequest[]);
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
    if (!walletClient || !address || !myGroup) {
      throw new Error('Wallet not connected or not an attester');
    }

    // Check if already signed by this group
    const sigs = (request.multisig_signatures || {}) as MultisigSignatures;
    if (sigs[myGroup]) {
      throw new Error(`Group ${myGroup.toUpperCase()} already signed this request`);
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
          signer_name: attesterInfo?.name,
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
  }, [walletClient, address, myGroup, attesterInfo, loadRequests]);

  return {
    pendingRequests,
    signRequest,
    myGroup,
    myName: attesterInfo?.name || null,
    groupLabel: attesterInfo?.groupLabel || null,
    isAttester,
    loading,
    signing,
    refresh: loadRequests,
  };
}
