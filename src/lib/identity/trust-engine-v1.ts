/**
 * Trust Engine v1 — Identity + Trust Layer Spec v1.0
 * 
 * TC = (0.30·VS + 0.25·BS + 0.15·SS + 0.20·OS + 0.10·HS) × RF
 * 
 * Range: 0.30 - 1.50
 * - VS = Verification Strength (DID + KYC)
 * - BS = Behavior Stability (consistency, action quality)
 * - SS = Social Trust (attestations, network)
 * - OS = On-chain Credibility (wallet age, tx realism)
 * - HS = Historical Cleanliness (no flags, low risk)
 * - RF = Risk Factor penalty (0.3 - 1.0)
 */

import { tcToTier, type TrustTier } from './trust-tier';

export interface TrustSignals {
  // Verification (DID level + KYC)
  did_level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
  email_verified: boolean;
  phone_verified: boolean;
  wallet_linked: boolean;
  kyc_passed: boolean;
  pplp_accepted: boolean;
  
  // Behavior
  account_age_days: number;
  consistency_streak: number;
  total_valid_actions: number;
  total_flagged_actions: number;
  anti_farm_risk_avg: number; // 0-1
  
  // Social
  attestations_received: number;
  attestations_weight_sum: number;
  community_endorsements: number;
  community_flags: number;
  mentor_sessions: number;
  
  // On-chain
  wallet_age_days: number;
  on_chain_tx_count: number;
  active_sbt_count: number;
  governance_clean: boolean;
  
  // History
  reward_reversal_count: number;
  ban_history_count: number;
  ip_collisions: number;
  is_blacklisted: boolean;
}

export interface TrustComputation {
  tc: number;
  tier: TrustTier;
  vs: number;
  bs: number;
  ss: number;
  os: number;
  hs: number;
  rf: number;
  sybil_risk: number;
  fraud_risk: number;
  cleanliness: number;
  permission_flags: PermissionFlags;
}

export interface PermissionFlags {
  can_earn_basic: boolean;
  can_receive_referral_rewards: boolean;
  can_vote: boolean;
  can_propose: boolean;
  can_issue_sbt: boolean;
  can_review_identity: boolean;
  can_mint_full: boolean; // T2+ for full FUN mint
}

const WEIGHTS = { vs: 0.30, bs: 0.25, ss: 0.15, os: 0.20, hs: 0.10 } as const;
const DID_VS: Record<string, number> = { L0: 0.2, L1: 0.5, L2: 0.7, L3: 0.85, L4: 1.0 };

function r4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ===== VS: Verification Strength =====
function calcVS(s: TrustSignals): number {
  const base = DID_VS[s.did_level] ?? 0.2;
  let bonus = 0;
  if (s.email_verified) bonus += 0.05;
  if (s.phone_verified) bonus += 0.05;
  if (s.wallet_linked) bonus += 0.10;
  if (s.kyc_passed) bonus += 0.15;
  if (s.pplp_accepted) bonus += 0.10;
  return clamp(base * 0.6 + bonus, 0, 1);
}

// ===== BS: Behavior Stability =====
function calcBS(s: TrustSignals): number {
  const ageFactor = Math.min(1, s.account_age_days / 365);
  const streakFactor = Math.min(1, Math.log(1 + s.consistency_streak) / Math.log(91));
  const total = Math.max(1, s.total_valid_actions + s.total_flagged_actions);
  const validRatio = s.total_valid_actions / total;
  const farmClean = Math.max(0, 1 - s.anti_farm_risk_avg);
  return clamp(ageFactor * 0.3 + streakFactor * 0.25 + validRatio * 0.3 + farmClean * 0.15, 0, 1);
}

// ===== SS: Social Trust =====
function calcSS(s: TrustSignals): number {
  const attestScore = Math.min(1, Math.sqrt(s.attestations_received) * 0.2 + s.attestations_weight_sum * 0.5);
  const endorseScore = Math.min(0.5, s.community_endorsements * 0.05);
  const mentorBonus = Math.min(0.3, s.mentor_sessions * 0.03);
  const flagPenalty = Math.min(0.4, s.community_flags * 0.05);
  return clamp(attestScore * 0.5 + endorseScore + mentorBonus - flagPenalty, 0, 1);
}

// ===== OS: On-chain Credibility =====
function calcOS(s: TrustSignals): number {
  if (!s.wallet_linked) return 0.2;
  const ageFactor = Math.min(1, s.wallet_age_days / 365);
  const txFactor = Math.min(1, Math.log(1 + s.on_chain_tx_count) / Math.log(101));
  const sbtFactor = Math.min(1, s.active_sbt_count * 0.1);
  const govClean = s.governance_clean ? 1 : 0.5;
  return clamp(ageFactor * 0.3 + txFactor * 0.3 + sbtFactor * 0.2 + govClean * 0.2, 0, 1);
}

// ===== HS: Historical Cleanliness =====
function calcHS(s: TrustSignals): number {
  let h = 1.0;
  h -= Math.min(0.3, s.reward_reversal_count * 0.05);
  h -= Math.min(0.5, s.ban_history_count * 0.25);
  h -= Math.min(0.2, s.ip_collisions * 0.02);
  if (s.is_blacklisted) h = 0;
  return clamp(h, 0, 1);
}

// ===== RF: Risk Factor (penalty multiplier) =====
function calcRF(s: TrustSignals): { rf: number; sybil: number; fraud: number } {
  let sybil = 0;
  sybil += Math.min(40, s.ip_collisions * 5);
  sybil += s.anti_farm_risk_avg * 30;
  if (!s.email_verified && !s.phone_verified) sybil += 10;
  if (s.wallet_age_days < 7) sybil += 10;
  if (s.is_blacklisted) sybil = 100;
  sybil = clamp(Math.round(sybil), 0, 100);

  let fraud = 0;
  fraud += Math.min(40, s.reward_reversal_count * 10);
  fraud += Math.min(30, s.community_flags * 5);
  fraud += s.ban_history_count * 20;
  if (s.is_blacklisted) fraud = 100;
  fraud = clamp(Math.round(fraud), 0, 100);

  // RF: 0.3 (critical) → 1.0 (clean)
  const maxRisk = Math.max(sybil, fraud);
  let rf = 1.0;
  if (maxRisk >= 80) rf = 0.3;
  else if (maxRisk >= 60) rf = 0.5;
  else if (maxRisk >= 40) rf = 0.7;
  else if (maxRisk >= 20) rf = 0.9;
  
  return { rf, sybil, fraud };
}

// ===== Permission Matrix =====
function calcPermissions(tc: number, tier: TrustTier, didLevel: string, sybilRisk: number): PermissionFlags {
  const didOrder = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 } as const;
  const dl = didOrder[didLevel as keyof typeof didOrder] ?? 0;
  const safe = sybilRisk < 60;
  
  return {
    can_earn_basic: dl >= 1 && tc >= 0.6 && safe,
    can_receive_referral_rewards: dl >= 2 && tc >= 0.9 && safe,
    can_vote: dl >= 2 && tc >= 1.0 && safe,
    can_propose: dl >= 3 && tc >= 1.1 && safe,
    can_issue_sbt: dl >= 4 && tc >= 1.25 && safe,
    can_review_identity: dl >= 3 && tc >= 1.15 && safe,
    can_mint_full: tier !== 'T0' && tier !== 'T1' && safe, // T2+
  };
}

// ===== MAIN =====
export function computeTrust(signals: TrustSignals): TrustComputation {
  const vs = r4(calcVS(signals));
  const bs = r4(calcBS(signals));
  const ss = r4(calcSS(signals));
  const os = r4(calcOS(signals));
  const hs = r4(calcHS(signals));
  const { rf, sybil, fraud } = calcRF(signals);

  const aggregate = vs * WEIGHTS.vs + bs * WEIGHTS.bs + ss * WEIGHTS.ss + os * WEIGHTS.os + hs * WEIGHTS.hs;
  // Map [0,1] aggregate → [0.30, 1.50] then apply RF
  const tcRaw = 0.30 + aggregate * 1.20;
  const tc = r4(clamp(tcRaw * rf, 0.30, 1.50));
  const tier = tcToTier(tc);
  const cleanliness = r4(hs);

  return {
    tc, tier, vs, bs, ss, os, hs, rf: r4(rf),
    sybil_risk: sybil,
    fraud_risk: fraud,
    cleanliness,
    permission_flags: calcPermissions(tc, tier, signals.did_level, sybil),
  };
}
