/**
 * PPLP Nonce Refresh
 * Resets failed multisig requests with fresh on-chain nonce and recalculated hashes
 */

import { supabase } from '@/integrations/supabase/client';
import { BrowserProvider, Contract } from 'ethers';
import { getContractAddress, FUN_MONEY_ABI } from './web3-config';
import { preparePPLPData } from './eip712-signer';
import { CONTRACT_ACTION } from './contract-helpers';

/**
 * Verify on-chain nonce matches the DB nonce for a request
 */
export async function verifyOnChainNonce(
  provider: BrowserProvider,
  recipientAddress: string,
  dbNonce: string
): Promise<{ valid: boolean; onChainNonce: string }> {
  const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, provider);
  const onChainNonce = await contract.nonces(recipientAddress);
  return {
    valid: onChainNonce.toString() === dbNonce,
    onChainNonce: onChainNonce.toString(),
  };
}

/**
 * Reset a failed/stale request with fresh on-chain nonce + recalculated hashes
 */
export async function resetRequestWithFreshNonce(
  requestId: string,
  provider: BrowserProvider
): Promise<{ success: boolean; newNonce: string }> {
  // 1. Fetch the current request
  const { data: req, error: fetchErr } = await supabase
    .from('pplp_mint_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchErr || !req) throw new Error('Request not found');

  // 2. Get fresh nonce from on-chain
  const contract = new Contract(getContractAddress(), FUN_MONEY_ABI, provider);
  const freshNonce = await contract.nonces(req.recipient_address);
  const nonceStr = freshNonce.toString();

  // 3. Recalculate action_hash + evidence_hash with new nonce
  const amount = BigInt(req.amount_wei || '0');
  const { actionHash, evidenceHash } = preparePPLPData({
    recipientAddress: req.recipient_address,
    actionType: CONTRACT_ACTION,
    amount,
    evidenceData: {
      source_mint_request_id: req.source_mint_request_id,
      refreshed_at: new Date().toISOString(),
    },
    nonce: freshNonce,
  });

  // 4. Update DB: new nonce, hashes, clear sigs, reset status
  const { error: updateErr } = await supabase
    .from('pplp_mint_requests')
    .update({
      nonce: nonceStr,
      action_hash: actionHash,
      evidence_hash: evidenceHash,
      status: 'pending_sig',
      multisig_signatures: {},
      multisig_completed_groups: [],
      error_message: null,
      tx_hash: null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', requestId);

  if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

  return { success: true, newNonce: nonceStr };
}

/**
 * Reset all failed requests with fresh nonces
 */
export async function resetAllFailedWithFreshNonce(
  provider: BrowserProvider
): Promise<{ success: number; fail: number; details: string[] }> {
  const { data: failedReqs } = await supabase
    .from('pplp_mint_requests')
    .select('id, recipient_address')
    .eq('status', 'failed');

  if (!failedReqs || failedReqs.length === 0) {
    return { success: 0, fail: 0, details: ['Không có request lỗi nào'] };
  }

  let success = 0, fail = 0;
  const details: string[] = [];

  for (const req of failedReqs) {
    try {
      const result = await resetRequestWithFreshNonce(req.id, provider);
      success++;
      details.push(`✅ ${req.recipient_address.slice(0, 10)}: nonce → ${result.newNonce}`);
    } catch (err: any) {
      fail++;
      details.push(`❌ ${req.recipient_address.slice(0, 10)}: ${err.message?.slice(0, 60)}`);
    }
  }

  return { success, fail, details };
}
