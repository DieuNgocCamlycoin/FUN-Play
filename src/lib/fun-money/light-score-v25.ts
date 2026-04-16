/**
 * Light Score Engine v2.5 — 16Apr2026
 * 3-Tier Light Score Architecture
 * 
 * 1. Personal Light Score (PLS) — individual verified actions
 * 2. Network Light Score (NLS) — enabling others to shine
 * 3. Legacy Light Score (LLS) — lasting systemic impact
 * 
 * Total Light Score (TLS) = α·PLS + β·NLS + γ·LLS
 * 
 * Raw Light → internal use (mint, governance)
 * Display Light → user-facing: 100 × log(1 + RawLS)
 * 
 * 6 TIERS:
 * Seed Light → Pure Light → Guiding Light → Radiant Light → Legacy Light → Cosmic Light
 * 
 * Uses Parameter Table v1.0 for all constants
 */

import {
  getConsistencyMultiplier,
  getPhaseWeights,
  checkActivation,
  rawToDisplay,
  calculateLongevity,
  RELIABILITY_TABLE,
  type SystemPhase,
} from './light-score-params-v1';

// ===== TIER SYSTEM =====

export type LightTierV25 =
  | 'seed_light'
  | 'pure_light'
  | 'guiding_light'
  | 'radiant_light'
  | 'legacy_light'
  | 'cosmic_light';

export interface LightTierConfig {
  id: LightTierV25;
  label: string;
  labelVi: string;
  emoji: string;
  minDisplayScore: number;
  maxDisplayScore: number | null;
  color: string;
  permissions: {
    can_create_proposal: boolean;
    can_verify_others: boolean;
    can_mentor: boolean;
    can_curate: boolean;
    can_validate_community: boolean;
    governance_weight: number;
    mint_mode: 'basic' | 'standard' | 'enhanced' | 'premium';
  };
}

export const LIGHT_TIERS_V25: LightTierConfig[] = [
  {
    id: 'seed_light',
    label: 'Seed Light',
    labelVi: 'Ánh Sáng Hạt Giống',
    emoji: '🌱',
    minDisplayScore: 0,
    maxDisplayScore: 49,
    color: 'from-gray-400 to-gray-500',
    permissions: {
      can_create_proposal: false, can_verify_others: false, can_mentor: false,
      can_curate: false, can_validate_community: false, governance_weight: 0, mint_mode: 'basic',
    },
  },
  {
    id: 'pure_light',
    label: 'Pure Light',
    labelVi: 'Ánh Sáng Thuần Khiết',
    emoji: '✨',
    minDisplayScore: 50,
    maxDisplayScore: 149,
    color: 'from-cyan-400 to-blue-500',
    permissions: {
      can_create_proposal: false, can_verify_others: false, can_mentor: false,
      can_curate: false, can_validate_community: false, governance_weight: 0.5, mint_mode: 'standard',
    },
  },
  {
    id: 'guiding_light',
    label: 'Guiding Light',
    labelVi: 'Ánh Sáng Dẫn Đường',
    emoji: '🌟',
    minDisplayScore: 150,
    maxDisplayScore: 349,
    color: 'from-green-400 to-emerald-500',
    permissions: {
      can_create_proposal: true, can_verify_others: false, can_mentor: true,
      can_curate: false, can_validate_community: false, governance_weight: 1.0, mint_mode: 'standard',
    },
  },
  {
    id: 'radiant_light',
    label: 'Radiant Light',
    labelVi: 'Ánh Sáng Rạng Rỡ',
    emoji: '☀️',
    minDisplayScore: 350,
    maxDisplayScore: 699,
    color: 'from-amber-400 to-orange-500',
    permissions: {
      can_create_proposal: true, can_verify_others: true, can_mentor: true,
      can_curate: true, can_validate_community: false, governance_weight: 1.5, mint_mode: 'enhanced',
    },
  },
  {
    id: 'legacy_light',
    label: 'Legacy Light',
    labelVi: 'Ánh Sáng Di Sản',
    emoji: '👑',
    minDisplayScore: 700,
    maxDisplayScore: 1499,
    color: 'from-purple-400 to-indigo-500',
    permissions: {
      can_create_proposal: true, can_verify_others: true, can_mentor: true,
      can_curate: true, can_validate_community: true, governance_weight: 2.0, mint_mode: 'premium',
    },
  },
  {
    id: 'cosmic_light',
    label: 'Cosmic Light',
    labelVi: 'Ánh Sáng Vũ Trụ',
    emoji: '🌌',
    minDisplayScore: 1500,
    maxDisplayScore: null,
    color: 'from-purple-500 via-pink-500 to-amber-400',
    permissions: {
      can_create_proposal: true, can_verify_others: true, can_mentor: true,
      can_curate: true, can_validate_community: true, governance_weight: 3.0, mint_mode: 'premium',
    },
  },
];

export function getLightTierV25(displayScore: number): LightTierConfig {
  for (let i = LIGHT_TIERS_V25.length - 1; i >= 0; i--) {
    if (displayScore >= LIGHT_TIERS_V25[i].minDisplayScore) {
      return LIGHT_TIERS_V25[i];
    }
  }
  return LIGHT_TIERS_V25[0];
}

// ===== 1. PERSONAL LIGHT SCORE (PLS) =====

export interface PLSInput {
  previous_pls: number;
  vvu_personal_sum: number;
  consistency: { active_streak_days: number };
  reliability: ReliabilityInput;
}

export interface ReliabilityInput {
  completion_rate: number;
  commitment_kept_rate: number;
  flag_count: number;
  reward_reversals: number;
  valid_reports_against: number;
}

/**
 * Consistency Multiplier (C_t) — Stepped table from spec
 * 1-3d → 0.95, 4-7d → 1.0, 8-30d → 1.05, 30-90d → 1.1, 90+ → 1.2
 */
export function consistencyMultiplierV25(streak: number): number {
  return getConsistencyMultiplier(streak);
}

/**
 * Reliability Multiplier (R_t) — 4 discrete levels from spec
 * Abandon 0.6-0.8, Normal 0.9-1.0, Good 1.0-1.1, Excellent 1.1-1.2
 */
export function reliabilityMultiplierV25(r: ReliabilityInput): number {
  // Compute a raw reliability signal
  let raw = 0;
  raw += r.completion_rate * 0.35;
  raw += r.commitment_kept_rate * 0.35;
  raw -= Math.min(0.3, r.flag_count * 0.05);
  raw -= Math.min(0.2, r.reward_reversals * 0.1);
  raw -= Math.min(0.15, r.valid_reports_against * 0.05);

  // Map to spec levels
  if (raw < 0.4) {
    // Abandon: 0.6-0.8
    return round4(0.6 + (raw / 0.4) * 0.2);
  }
  if (raw < 0.6) {
    // Normal: 0.9-1.0
    return round4(0.9 + ((raw - 0.4) / 0.2) * 0.1);
  }
  if (raw < 0.8) {
    // Good: 1.0-1.1
    return round4(1.0 + ((raw - 0.6) / 0.2) * 0.1);
  }
  // Excellent: 1.1-1.2
  return round4(Math.min(1.2, 1.1 + ((raw - 0.8) / 0.2) * 0.1));
}

/**
 * ΔPLS_t = Σ VVU_personal × C_t × R_t
 */
export function calculatePLS(input: PLSInput): { pls: number; delta: number; c: number; r: number } {
  const c = consistencyMultiplierV25(input.consistency.active_streak_days);
  const r = reliabilityMultiplierV25(input.reliability);
  const delta = round4(input.vvu_personal_sum * c * r);
  const pls = round4(input.previous_pls + delta);
  return { pls: Math.max(0, pls), delta, c, r };
}

// ===== 2. NETWORK LIGHT SCORE (NLS) =====

export interface NLSInput {
  previous_nls: number;
  vvu_others_enabled_sum: number;
  network_quality: number;   // QN: 0.2-1.5
  trust_network: number;     // TN: 0.5-1.3
  diversity_network: number; // DN: 0.8-1.2
}

export function calculateNLS(input: NLSInput): { nls: number; delta: number } {
  const delta = round4(
    input.vvu_others_enabled_sum *
    input.network_quality *
    input.trust_network *
    input.diversity_network
  );
  const nls = round4(input.previous_nls + delta);
  return { nls: Math.max(0, nls), delta };
}

// ===== 3. LEGACY LIGHT SCORE (LLS) =====

export interface LLSInput {
  previous_lls: number;
  persistent_values: PersistentValue[];
}

export interface PersistentValue {
  pv: number;           // 1-100
  ad: number;           // 0.5-1.5
  days_active: number;  // for LO calculation
  pu: number;           // 0.5-1.5
}

export function calculateLLS(input: LLSInput): { lls: number; delta: number } {
  let delta = 0;
  for (const pv of input.persistent_values) {
    const lo = calculateLongevity(pv.days_active);
    delta += pv.pv * pv.ad * lo * pv.pu;
  }
  delta = round4(delta);
  const lls = round4(input.previous_lls + delta);
  return { lls: Math.max(0, lls), delta };
}

// ===== 4. TOTAL LIGHT SCORE =====

export interface TLSResult {
  raw_pls: number;
  raw_nls: number;
  raw_lls: number;
  raw_tls: number;
  display_tls: number;
  tier: LightTierConfig;
  pls_delta: number;
  nls_delta: number;
  lls_delta: number;
  phase: SystemPhase;
}

/**
 * Total Light Score — phase-aware weights
 * Early:  α=0.7, β=0.2, γ=0.1
 * Growth: α=0.5, β=0.3, γ=0.2
 * Mature: α=0.4, β=0.3, γ=0.3
 */
export function calculateTLS(
  pls: number,
  nls: number,
  lls: number,
  plsDelta: number = 0,
  nlsDelta: number = 0,
  llsDelta: number = 0,
  phase?: SystemPhase,
): TLSResult {
  const weights = getPhaseWeights(phase);
  const raw_tls = round4(
    weights.alpha * pls +
    weights.beta * nls +
    weights.gamma * lls
  );

  const display_tls = rawToDisplay(raw_tls);
  const tier = getLightTierV25(display_tls);

  return {
    raw_pls: pls,
    raw_nls: nls,
    raw_lls: lls,
    raw_tls,
    display_tls,
    tier,
    pls_delta: plsDelta,
    nls_delta: nlsDelta,
    lls_delta: llsDelta,
    phase: phase ?? 'early',
  };
}

// ===== 5. SMART ACTIVATION =====

export interface ActivationStatus {
  earning_enabled: boolean;
  earning_advanced: boolean;
  referral_rewards: boolean;
  voting_enabled: boolean;
  proposal_enabled: boolean;
  mentor_enabled: boolean;
  curator_enabled: boolean;
  validator_enabled: boolean;
}

/**
 * Smart Activation — uses spec Activation Thresholds
 * Earn basic: LS>10 + TC>0.8
 * Referral: LS>50
 * Advanced: LS>100
 * Vote: LS>200
 * Proposal: LS>500
 * Validator: LS>1000
 */
export function getActivationStatus(tls: TLSResult, trustTier: string, trustConfidence?: number): ActivationStatus {
  const ls = tls.display_tls;
  const tc = trustConfidence;
  const isTrusted = trustTier === 'trusted' || trustTier === 'veteran' || trustTier === 'verified' || trustTier === 'strong' || trustTier === 'core';

  return {
    earning_enabled: checkActivation('earn_basic', ls, tc),
    earning_advanced: checkActivation('earn_advanced', ls, tc),
    referral_rewards: checkActivation('referral_rewards', ls, tc),
    voting_enabled: checkActivation('governance_vote', ls, tc),
    proposal_enabled: checkActivation('proposal_submit', ls, tc),
    mentor_enabled: tls.tier.permissions.can_mentor && isTrusted,
    curator_enabled: checkActivation('validator_curator', ls, tc) || tls.tier.permissions.can_curate,
    validator_enabled: checkActivation('validator_curator', ls, tc) && isTrusted,
  };
}

// ===== 6. GOVERNANCE & MINT WEIGHT =====

export function getMintWeight(rawTLS: number, trustTier: string): number {
  const tierMultiplier: Record<string, number> = {
    unknown: 0.3, new: 0.5, basic: 0.7, standard: 0.8,
    verified: 1.0, trusted: 1.0, strong: 1.1, veteran: 1.2, core: 1.3,
  };
  const mult = tierMultiplier[trustTier] ?? 0.8;
  return round4(rawTLS * mult);
}

export function getGovernanceWeight(displayTLS: number): number {
  const tier = getLightTierV25(displayTLS);
  return tier.permissions.governance_weight;
}

// ===== UTILITY =====

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
