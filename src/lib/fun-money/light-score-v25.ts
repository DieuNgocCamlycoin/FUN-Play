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
 */

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
  // Access control unlocks
  permissions: {
    can_create_proposal: boolean;
    can_verify_others: boolean;
    can_mentor: boolean;
    can_curate: boolean;
    can_validate_community: boolean;
    governance_weight: number; // 0-3
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
      can_create_proposal: false,
      can_verify_others: false,
      can_mentor: false,
      can_curate: false,
      can_validate_community: false,
      governance_weight: 0,
      mint_mode: 'basic',
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
      can_create_proposal: false,
      can_verify_others: false,
      can_mentor: false,
      can_curate: false,
      can_validate_community: false,
      governance_weight: 0.5,
      mint_mode: 'standard',
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
      can_create_proposal: true,
      can_verify_others: false,
      can_mentor: true,
      can_curate: false,
      can_validate_community: false,
      governance_weight: 1.0,
      mint_mode: 'standard',
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
      can_create_proposal: true,
      can_verify_others: true,
      can_mentor: true,
      can_curate: true,
      can_validate_community: false,
      governance_weight: 1.5,
      mint_mode: 'enhanced',
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
      can_create_proposal: true,
      can_verify_others: true,
      can_mentor: true,
      can_curate: true,
      can_validate_community: true,
      governance_weight: 2.0,
      mint_mode: 'premium',
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
      can_create_proposal: true,
      can_verify_others: true,
      can_mentor: true,
      can_curate: true,
      can_validate_community: true,
      governance_weight: 3.0,
      mint_mode: 'premium',
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

// ===== WEIGHT CONSTANTS =====

/** TLS = α·PLS + β·NLS + γ·LLS */
export const LIGHT_WEIGHTS = {
  alpha: 0.50, // Personal Light
  beta: 0.30,  // Network Light
  gamma: 0.20, // Legacy Light
} as const;

// ===== 1. PERSONAL LIGHT SCORE (PLS) =====

export interface PLSInput {
  previous_pls: number;
  vvu_personal_sum: number; // sum of VVU for personal actions this period
  consistency: ConsistencyInput;
  reliability: ReliabilityInput;
}

export interface ConsistencyInput {
  active_streak_days: number;
  k: number; // tuning constant, default 6
}

export interface ReliabilityInput {
  completion_rate: number;       // 0-1 ratio of completed actions
  commitment_kept_rate: number;  // 0-1
  flag_count: number;            // times flagged
  reward_reversals: number;      // times rewards reversed
  valid_reports_against: number; // valid community reports
}

/**
 * Consistency Multiplier (C_t)
 * C_t = 1 + log(1 + ActiveStreak) / k
 * Range: 0.9 → 1.3
 */
export function consistencyMultiplierV25(streak: number, k: number = 6): number {
  const raw = 1 + Math.log(1 + streak) / k;
  return round4(Math.max(0.9, Math.min(1.3, raw)));
}

/**
 * Reliability Multiplier (R_t)
 * Range: 0.5 → 1.2
 */
export function reliabilityMultiplierV25(r: ReliabilityInput): number {
  let score = 0.8; // base

  // Completion rate: +0.2 max
  score += r.completion_rate * 0.2;

  // Commitment kept: +0.15 max
  score += r.commitment_kept_rate * 0.15;

  // Penalties
  score -= Math.min(0.3, r.flag_count * 0.05);
  score -= Math.min(0.2, r.reward_reversals * 0.1);
  score -= Math.min(0.15, r.valid_reports_against * 0.05);

  return round4(Math.max(0.5, Math.min(1.2, score)));
}

/**
 * ΔPLS_t = Σ VVU_personal × C_t × R_t
 * PLS_t = PLS_{t-1} + ΔPLS_t
 */
export function calculatePLS(input: PLSInput): { pls: number; delta: number; c: number; r: number } {
  const c = consistencyMultiplierV25(input.consistency.active_streak_days, input.consistency.k || 6);
  const r = reliabilityMultiplierV25(input.reliability);
  const delta = round4(input.vvu_personal_sum * c * r);
  const pls = round4(input.previous_pls + delta);

  return { pls: Math.max(0, pls), delta, c, r };
}

// ===== 2. NETWORK LIGHT SCORE (NLS) =====

export interface NLSInput {
  previous_nls: number;
  vvu_others_enabled_sum: number; // VVU from enabling others
  network_quality: number;         // QN: quality of network effect 0-1
  trust_network: number;           // TN: trust of downstream users 0-1
  diversity_network: number;       // DN: diversity (not just 1 person) 0-1
}

/**
 * ΔNLS_t = Σ VVU_others_enabled × QN × TN × DN
 * NLS_t = NLS_{t-1} + ΔNLS_t
 */
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
  pv: number;   // Persistent Value score
  ad: number;   // Active Duration factor 0-1
  lo: number;   // Longevity factor 0-1
  pu: number;   // Public Utility factor 0-1
}

/**
 * ΔLLS_t = Σ PV_i × AD_i × LO_i × PU_i
 * LLS_t = LLS_{t-1} + ΔLLS_t
 */
export function calculateLLS(input: LLSInput): { lls: number; delta: number } {
  let delta = 0;
  for (const pv of input.persistent_values) {
    delta += pv.pv * pv.ad * pv.lo * pv.pu;
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
  raw_tls: number;        // Raw: α·PLS + β·NLS + γ·LLS
  display_tls: number;    // Display: 100 × log(1 + RawTLS)
  tier: LightTierConfig;
  pls_delta: number;
  nls_delta: number;
  lls_delta: number;
}

/**
 * Total Light Score
 * Raw TLS = α·PLS + β·NLS + γ·LLS
 * Display TLS = 100 × log(1 + Raw TLS)
 */
export function calculateTLS(
  pls: number,
  nls: number,
  lls: number,
  plsDelta: number = 0,
  nlsDelta: number = 0,
  llsDelta: number = 0,
): TLSResult {
  const raw_tls = round4(
    LIGHT_WEIGHTS.alpha * pls +
    LIGHT_WEIGHTS.beta * nls +
    LIGHT_WEIGHTS.gamma * lls
  );

  const display_tls = round2(100 * Math.log(1 + Math.max(0, raw_tls)));
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
  };
}

// ===== 5. SMART ACTIVATION =====

export interface ActivationStatus {
  earning_enabled: boolean;
  voting_enabled: boolean;
  proposal_enabled: boolean;
  mentor_enabled: boolean;
  curator_enabled: boolean;
  validator_enabled: boolean;
}

/**
 * Smart Activation — auto-determines user capabilities
 * No blockchain knowledge needed from user
 */
export function getActivationStatus(tls: TLSResult, trustTier: string): ActivationStatus {
  const p = tls.tier.permissions;
  const isTrusted = trustTier === 'trusted' || trustTier === 'veteran';

  return {
    earning_enabled: tls.display_tls >= 10, // Minimal threshold
    voting_enabled: p.governance_weight > 0,
    proposal_enabled: p.can_create_proposal,
    mentor_enabled: p.can_mentor && isTrusted,
    curator_enabled: p.can_curate,
    validator_enabled: p.can_validate_community && isTrusted,
  };
}

// ===== 6. GOVERNANCE & MINT WEIGHT =====

/**
 * Mint weight based on TLS
 * Higher light = proportionally more mint
 */
export function getMintWeight(rawTLS: number, trustTier: string): number {
  const tierMultiplier: Record<string, number> = {
    new: 0.5,
    standard: 0.8,
    trusted: 1.0,
    veteran: 1.2,
  };
  const mult = tierMultiplier[trustTier] ?? 0.8;
  return round4(rawTLS * mult);
}

/**
 * Governance vote weight
 */
export function getGovernanceWeight(displayTLS: number): number {
  const tier = getLightTierV25(displayTLS);
  return tier.permissions.governance_weight;
}

// ===== UTILITY =====

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
