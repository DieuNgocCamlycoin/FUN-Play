/**
 * useMintSubmit - Hook for Admin to submit multisig mint on-chain
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { FUN_MONEY_ABI, getContractAddress } from '@/lib/fun-money/web3-config';
import { CONTRACT_ACTION } from '@/lib/fun-money/contract-helpers';
import { REQUIRED_GROUPS } from '@/lib/fun-money/pplp-multisig-config';
import type { PPLPMintRequest, MultisigSignatures } from '@/lib/fun-money/pplp-multisig-types';

export function useMintSubmit() {
  const { isConnected } = useWalletContext();
  const { data: walletClient } = useWalletClient();
  const [signedRequests, setSignedRequests] = useState<PPLPMintRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Load signed requests
  const loadSignedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pplp_mint_requests')
        .select('*')
        .eq('status', 'signed')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setSignedRequests(data as unknown as PPLPMintRequest[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSignedRequests();

    const channel = supabase
      .channel('pplp-mint-requests-admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pplp_mint_requests',
      }, () => {
        loadSignedRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSignedRequests]);

  // Verify nonce on-chain matches DB
  const verifyNonce = useCallback(async (recipientAddress: string, dbNonce: string): Promise<boolean> => {
    if (!walletClient) return false;
    try {
      const provider = new BrowserProvider(walletClient as any);
      const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, provider);
      const onChainNonce = await contract.nonces(recipientAddress);
      return onChainNonce.toString() === dbNonce;
    } catch (err) {
      console.error('Nonce verification failed:', err);
      return false;
    }
  }, [walletClient]);

  // Submit mint on-chain
  const submitMint = useCallback(async (request: PPLPMintRequest) => {
    if (!walletClient) throw new Error('Wallet not connected');

    setIsSubmitting(request.id);
    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, signer);

      // Extract signatures in order [WILL, WISDOM, LOVE]
      const sigs = request.multisig_signatures as MultisigSignatures;
      const orderedSigs = REQUIRED_GROUPS.map(group => {
        const sig = sigs[group];
        if (!sig) throw new Error(`Missing signature from group: ${group.toUpperCase()}`);
        return sig.signature;
      });

      // Update status to submitted
      await supabase
        .from('pplp_mint_requests')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', request.id);

      // Submit on-chain
      const tx = await contract.lockWithPPLP(
        request.recipient_address,
        CONTRACT_ACTION,
        BigInt(request.amount_wei),
        request.evidence_hash || '0x' + '0'.repeat(64),
        orderedSigs
      );

      const receipt = await tx.wait(2); // Wait 2 confirmations

      // Update to confirmed
      await supabase
        .from('pplp_mint_requests')
        .update({
          status: 'confirmed',
          tx_hash: receipt.hash,
          block_number: receipt.blockNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      await loadSignedRequests();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      // Update to failed
      await supabase
        .from('pplp_mint_requests')
        .update({
          status: 'failed',
          error_message: err.message?.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      await loadSignedRequests();
      throw err;
    } finally {
      setIsSubmitting(null);
    }
  }, [walletClient, loadSignedRequests]);

  return {
    signedRequests,
    submitMint,
    verifyNonce,
    isSubmitting,
    loading,
    refresh: loadSignedRequests,
  };
}
