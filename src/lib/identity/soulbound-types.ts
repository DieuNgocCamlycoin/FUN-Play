/**
 * Soulbound Token & Digital Identity Types — v1.0
 * 16Apr2026
 * 
 * DID Levels: email → phone → KYC → SBT
 * SBT: Non-transferable identity token bound to user
 * DIB: Digital Identity Bank — aggregated identity score
 */

// ===== DID VERIFICATION LEVELS =====

export type DIDLevel = 'none' | 'email' | 'phone' | 'kyc' | 'sbt';

export interface DIDVerification {
  level: DIDLevel;
  email_verified: boolean;
  phone_verified: boolean;
  kyc_verified: boolean;
  sbt_minted: boolean;
  verified_at?: string;
  kyc_provider?: string;
  sbt_token_id?: string;
  sbt_chain?: string;
}

export const DID_LEVEL_ORDER: DIDLevel[] = ['none', 'email', 'phone', 'kyc', 'sbt'];

export function getDIDLevel(v: Partial<DIDVerification>): DIDLevel {
  if (v.sbt_minted) return 'sbt';
  if (v.kyc_verified) return 'kyc';
  if (v.phone_verified) return 'phone';
  if (v.email_verified) return 'email';
  return 'none';
}

// ===== SOULBOUND TOKEN (SBT) =====

export interface SoulboundToken {
  token_id: string;
  user_id: string;
  chain: string;
  contract_address: string;
  minted_at: string;
  metadata: SBTMetadata;
  is_active: boolean;
  revoked_at?: string;
  revoke_reason?: string;
}

export interface SBTMetadata {
  version: string;
  did_level: DIDLevel;
  trust_tier: string;
  identity_score: number;
  created_at: string;
  attestations: SBTAttestation[];
}

export interface SBTAttestation {
  type: 'identity' | 'behavior' | 'community' | 'contribution';
  issuer: string;
  value: number;
  issued_at: string;
  expires_at?: string;
}

// ===== DIGITAL IDENTITY BANK (DIB) =====

export interface DIBScore {
  user_id: string;
  did_level: DIDLevel;
  identity_completeness: number;   // 0-1
  behavioral_trust: number;        // 0-1
  community_standing: number;      // 0-1
  contribution_history: number;    // 0-1
  aggregate_score: number;         // 0-1
  tc_e: number;                    // Final Trust Confidence 0.5-1.5
  computed_at: string;
}

// ===== IDENTITY PROOF RECORD =====

export type ProofType = 
  | 'email_verification'
  | 'phone_verification'
  | 'kyc_document'
  | 'wallet_ownership'
  | 'sbt_mint'
  | 'social_account'
  | 'community_vouch'
  | 'pplp_acceptance';

export interface IdentityProof {
  id: string;
  user_id: string;
  proof_type: ProofType;
  provider: string;
  proof_hash: string;
  verified: boolean;
  verified_at?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ===== TC_e MAPPING =====

export const DID_TO_TRUST_TIER: Record<DIDLevel, string> = {
  none: 'unknown',
  email: 'basic',
  phone: 'basic',
  kyc: 'verified',
  sbt: 'strong',
};
