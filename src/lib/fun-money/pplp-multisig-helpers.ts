/**
 * PPLP Multisig Helpers
 * Creates multisig mint requests from approved mint_requests
 * Supports consolidation: multiple requests per user → 1 multisig
 */

import { supabase } from '@/integrations/supabase/client';
import { BrowserProvider } from 'ethers';
import { getNonce } from './web3-config';
import { preparePPLPData } from './eip712-signer';
import { CONTRACT_ACTION } from './contract-helpers';
import { REQUIRED_GROUPS } from './pplp-multisig-config';

export interface MintRequestForMultisig {
  id: string;
  user_id: string;
  user_wallet_address: string;
  action_type: string;
  calculated_amount_atomic: string;
  calculated_amount_formatted?: string | null;
  action_evidence: object;
  platform_id: string;
}

export interface CreateMultisigParams {
  /** Original mint_request record */
  mintRequest: MintRequestForMultisig;
  /** Ethers BrowserProvider for reading nonce on-chain */
  provider: BrowserProvider;
}

/** Parse amount to BigInt wei from atomic or formatted string */
function resolveAmount(atomic: string, formatted?: string | null): bigint {
  let amount = BigInt(atomic || '0');
  if (amount === 0n && formatted) {
    const numStr = formatted.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(numStr);
    if (parsed > 0) {
      const [whole, decimal = ''] = parsed.toFixed(18).split('.');
      amount = BigInt(whole + decimal.padEnd(18, '0').slice(0, 18));
    }
  }
  return amount;
}

/**
 * Create a pplp_mint_requests record from an approved mint_request.
 */
export async function createMultisigRequest({ mintRequest, provider }: CreateMultisigParams) {
  const nonce = await getNonce(provider, mintRequest.user_wallet_address);
  const amount = resolveAmount(mintRequest.calculated_amount_atomic, mintRequest.calculated_amount_formatted);

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

  const { data, error } = await supabase
    .from('pplp_mint_requests')
    .insert({
      user_id: mintRequest.user_id,
      recipient_address: mintRequest.user_wallet_address,
      action_type: mintRequest.action_type,
      amount: Number(amount) / 1e18,
      amount_wei: amount.toString(),
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

/**
 * Group requests by user_id, consolidate amounts, create 1 multisig per user.
 * Returns { success, fail, created } counts.
 */
export async function createConsolidatedMultisigRequests(
  requests: MintRequestForMultisig[],
  provider: BrowserProvider
): Promise<{ success: number; fail: number; details: string[] }> {
  // Group by user_id
  const grouped = new Map<string, MintRequestForMultisig[]>();
  for (const r of requests) {
    const list = grouped.get(r.user_id) || [];
    list.push(r);
    grouped.set(r.user_id, list);
  }

  let success = 0, fail = 0;
  const details: string[] = [];

  for (const [userId, userRequests] of grouped) {
    try {
      const walletAddress = userRequests[0].user_wallet_address;
      const platformId = userRequests[0].platform_id;

      // Sum all amounts
      let totalAmount = 0n;
      const sourceIds: string[] = [];
      const actionTypes = new Set<string>();

      for (const r of userRequests) {
        totalAmount += resolveAmount(r.calculated_amount_atomic, r.calculated_amount_formatted);
        sourceIds.push(r.id);
        actionTypes.add(r.action_type);
      }

      if (totalAmount === 0n) {
        fail++;
        details.push(`${walletAddress.slice(0, 10)}: Amount = 0, skipped`);
        continue;
      }

      const nonce = await getNonce(provider, walletAddress);
      const consolidatedAction = userRequests.length === 1
        ? userRequests[0].action_type
        : 'CONSOLIDATED';

      const { actionHash, evidenceHash } = preparePPLPData({
        recipientAddress: walletAddress,
        actionType: CONTRACT_ACTION,
        amount: totalAmount,
        evidenceData: {
          consolidated: true,
          source_count: userRequests.length,
          source_ids: sourceIds,
          action_types: Array.from(actionTypes),
        },
        nonce,
      });

      // Create single multisig request
      const { data, error } = await supabase
        .from('pplp_mint_requests')
        .insert({
          user_id: userId,
          recipient_address: walletAddress,
          action_type: consolidatedAction,
          amount: Number(totalAmount) / 1e18,
          amount_wei: totalAmount.toString(),
          action_hash: actionHash,
          evidence_hash: evidenceHash,
          nonce: nonce.toString(),
          status: 'pending_sig',
          multisig_required_groups: REQUIRED_GROUPS,
          multisig_completed_groups: [],
          multisig_signatures: {},
          platform_id: platformId,
          source_mint_request_id: sourceIds[0] as any,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Mark all source requests as approved with consolidation note
      const reason = `Consolidated ${userRequests.length} requests → Multisig 3/3 (pplp_mint_requests.id: ${data.id})`;
      for (const r of userRequests) {
        await supabase
          .from('mint_requests')
          .update({
            status: 'approved',
            decision_reason: reason,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', r.id);
      }

      const totalFun = (Number(totalAmount) / 1e18).toFixed(2);
      details.push(`✅ ${walletAddress.slice(0, 10)}: ${userRequests.length} requests → ${totalFun} FUN`);
      success++;
    } catch (err: any) {
      fail++;
      details.push(`❌ ${userId.slice(0, 8)}: ${err.message?.slice(0, 60)}`);
    }
  }

  return { success, fail, details };
}
