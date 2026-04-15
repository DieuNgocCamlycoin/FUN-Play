/**
 * useMintSubmit — Hook for Admin to submit direct mint on-chain
 * SDK v2.0 — FUNMoneyMinter (1-step mintValidatedAction)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWalletClient } from 'wagmi';
import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import { FUN_MONEY_ABI, getContractAddress } from '@/lib/fun-money/web3-config';

export interface MintSubmitRequest {
  id: string;
  user_id: string;
  recipient_address: string;
  action_type: string;
  amount_wei: string;
  status: string;
  tx_hash: string | null;
  block_number: number | null;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
  platform_id?: string;
  /** Current wallet from profile — for mismatch detection */
  current_wallet?: string | null;
}

export function useMintSubmit() {
  const { isConnected } = useWalletContext();
  const { data: walletClient } = useWalletClient();
  const [pendingRequests, setPendingRequests] = useState<MintSubmitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Load requests ready to mint (status = 'approved' or 'signed')
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pplp_mint_requests')
        .select('*')
        .in('status', ['signed', 'pending_sig', 'signing'])
        .order('created_at', { ascending: true });

      if (!error && data) {
        const requests = data as unknown as MintSubmitRequest[];

        // Fetch current wallet addresses from profiles for mismatch detection
        const userIds = [...new Set(requests.map(r => r.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, wallet_address')
            .in('id', userIds);

          const walletMap = new Map<string, string | null>();
          profiles?.forEach((p: any) => walletMap.set(p.id, p.wallet_address));

          requests.forEach(r => {
            r.current_wallet = walletMap.get(r.user_id) || null;
          });
        }

        setPendingRequests(requests);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel('pplp-mint-requests-admin')
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
  }, [loadRequests]);

  // Submit mint on-chain via mintValidatedAction
  const submitMint = useCallback(async (request: MintSubmitRequest) => {
    if (!walletClient) throw new Error('Wallet not connected');

    setIsSubmitting(request.id);
    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, signer);

      // Create unique actionId
      const actionId = keccak256(toUtf8Bytes(JSON.stringify({
        requestId: request.id,
        recipient: request.recipient_address,
        amount: request.amount_wei,
      })));

      // Create validation digest
      const validationDigest = keccak256(toUtf8Bytes(JSON.stringify({
        requestId: request.id,
        actionType: request.action_type,
        timestamp: Date.now(),
      })));

      // Update status to submitted
      await supabase
        .from('pplp_mint_requests')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', request.id);

      // Submit on-chain — 99/1 split handled by contract
      const tx = await contract.mintValidatedAction(
        actionId,
        request.recipient_address,
        BigInt(request.amount_wei),
        validationDigest
      );

      const receipt = await tx.wait(2);

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

      await loadRequests();
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      await supabase
        .from('pplp_mint_requests')
        .update({
          status: 'failed',
          error_message: err.message?.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      await loadRequests();
      throw err;
    } finally {
      setIsSubmitting(null);
    }
  }, [walletClient, loadRequests]);

  return {
    signedRequests: pendingRequests,
    submitMint,
    isSubmitting,
    loading,
    refresh: loadRequests,
  };
}
