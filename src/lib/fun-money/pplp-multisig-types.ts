/**
 * PPLP Multisig Types & Interfaces
 */

import type { GovGroupName } from './pplp-multisig-config';

// ===== STATUS FLOW =====

export type PPLPMintStatus = 
  | 'pending_sig'  // Waiting for first signature
  | 'signing'      // 1-2 signatures collected
  | 'signed'       // All 3 signatures collected
  | 'submitted'    // TX submitted on-chain
  | 'confirmed'    // TX confirmed
  | 'failed';      // TX failed / rejected

// ===== SIGNATURE TYPES =====

export interface MultisigSignature {
  signer: string;        // Wallet address
  signature: string;     // EIP-712 signature hex
  signed_at: string;     // ISO timestamp
  signer_name?: string;  // Attester name
}

export type MultisigSignatures = Partial<Record<GovGroupName, MultisigSignature>>;

// ===== MINT REQUEST =====

export interface PPLPMintRequest {
  id: string;
  user_id: string;
  recipient_address: string;
  action_ids: string[];
  action_type: string;
  amount: number;
  amount_wei: string;
  action_hash: string | null;
  evidence_hash: string | null;
  nonce: string | null;
  multisig_signatures: MultisigSignatures;
  multisig_completed_groups: GovGroupName[];
  multisig_required_groups: GovGroupName[];
  status: PPLPMintStatus;
  tx_hash: string | null;
  block_number: number | null;
  platform_id: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ===== SIGNING PAYLOAD =====

export interface SigningPayload {
  requestId: string;
  user: string;
  actionHash: string;
  amount: string;        // Wei string
  evidenceHash: string;
  nonce: string;
}
