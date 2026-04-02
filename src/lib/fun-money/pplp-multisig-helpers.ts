/**
 * PPLP Multisig Helpers
 * Creates multisig mint requests from approved mint_requests
 */

import { supabase } from '@/integrations/supabase/client';
import { BrowserProvider } from 'ethers';
import { getNonce } from './web3-config';
import { preparePPLPData } from './eip712-signer';
import { CONTRACT_ACTION } from './contract-helpers';
import { REQUIRED_GROUPS } from './pplp-multisig-config';

export interface CreateMultisigParams {
  /** Original mint_request record */
  mintRequest: {
    id: string;
    user_id: string;
    user_wallet_address: string;
    action_type: string;
    calculated_amount_atomic: string;
    action_evidence: object;
    platform_id: string;
  };
  /** Ethers BrowserProvider for reading nonce on-chain */
  provider: BrowserProvider;
}

/**
 * Create a pplp_mint_requests record from an approved mint_request.
 * Reads on-chain nonce, generates action_hash & evidence_hash.
 */
export async function createMultisigRequest({ mintRequest, provider }: CreateMultisigParams) {
  // 1. Read on-chain nonce for recipient
  const nonce = await getNonce(provider, mintRequest.user_wallet_address);

  // 2. Resolve amount - fallback to calculated_amount_formatted if atomic is "0"
  let amount = BigInt(mintRequest.calculated_amount_atomic || '0');
  if (amount === 0n && mintRequest.calculated_amount_formatted) {
    // Parse "15187.22 FUN" or "15187.22" → wei (×10^18)
    const numStr = mintRequest.calculated_amount_formatted.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(numStr);
    if (parsed > 0) {
      // Convert to wei: multiply by 10^18 using string math to avoid float precision issues
      const [whole, decimal = ''] = parsed.toFixed(18).split('.');
      amount = BigInt(whole + decimal.padEnd(18, '0').slice(0, 18));
      console.log(`[Multisig] Fallback amount from formatted: ${numStr} → ${amount.toString()} wei`);
    }
  }

  // 3. Prepare hashes
  const { actionHash, evidenceHash } = preparePPLPData({
    recipientAddress: mintRequest.user_wallet_address,
    actionType: CONTRACT_ACTION,
    amount,
    evidenceData: {
      ...(mintRequest.action_evidence as Record<string, unknown>),
      originalAction: mintRequest.action_type,
      source_mint_request_id: mintRequest.id,
    },
    nonce,
  });

  // 3. Insert into pplp_mint_requests
  const { data, error } = await supabase
    .from('pplp_mint_requests')
    .insert({
      user_id: mintRequest.user_id,
      recipient_address: mintRequest.user_wallet_address,
      action_type: mintRequest.action_type,
      amount: Number(amount) / 1e18, // human-readable
      amount_wei: mintRequest.calculated_amount_atomic,
      action_hash: actionHash,
      evidence_hash: evidenceHash,
      nonce: nonce.toString(),
      status: 'pending_sig',
      multisig_required_groups: REQUIRED_GROUPS,
      multisig_completed_groups: [],
      multisig_signatures: {},
      platform_id: mintRequest.platform_id,
      source_mint_request_id: mintRequest.id as any,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create multisig request: ${error.message}`);

  // 4. Update original mint_request status to 'approved' with note
  await supabase
    .from('mint_requests')
    .update({
      status: 'approved',
      decision_reason: `Routed to Multisig 3/3 (pplp_mint_requests.id: ${data.id})`,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', mintRequest.id);

  return data;
}
