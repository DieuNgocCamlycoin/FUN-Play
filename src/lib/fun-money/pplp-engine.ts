/**
 * FUN Money PPLP Scoring Engine
 * SDK v1.0
 */

// ===== TYPE DEFINITIONS =====

export interface PillarScores {
  S: number; // Service (0-100)
  T: number; // Truth (0-100)
  H: number; // Healing (0-100)
  C: number; // Contribution (0-100)
  U: number; // Unity (0-100)
}

export interface UnitySignals {
  collaboration: boolean;
  beneficiaryConfirmed: boolean;
  communityEndorsement: boolean;
  bridgeValue: boolean;
  conflictResolution?: boolean;
  partnerAttested?: boolean;
  witnessCount?: number;
}

export interface Multipliers {
  Q: number; // Quality (0.5 - 3.0)
  I: number; // Impact (0.5 - 5.0)
  K: number; // Integrity (0.0 - 1.0)
  Ux: number; // Unity (0.5 - 2.5)
}

export type MintDecision = 'AUTHORIZE' | 'REJECT' | 'REVIEW_HOLD' | 'RECYCLE';

/**
 * FUN Money không burn – không tiêu hủy.
 * Mọi FUN chỉ đổi trạng thái và nơi cư trú.
 */
export type FunMoneyLifecycleState = 'LOCKED' | 'ACTIVATED' | 'FLOWING' | 'RECYCLE';

export interface ScoringResult {
  lightScore: number;
  unityScore: number;
  multipliers: Multipliers;
  baseRewardAtomic: string;
  calculatedAmountAtomic: string;
  calculatedAmountFormatted: string;
  decision: MintDecision;
  reasonCodes: string[];
}

// ===== CONFIGURATION =====

const PILLAR_WEIGHTS = {
  S: 0.25,
  T: 0.20,
  H: 0.20,
  C: 0.20,
  U: 0.15
};

const UNITY_WEIGHTS = {
  collaboration: 0.40,
  beneficiaryConfirmed: 0.30,
  communityEndorsement: 0.20,
  bridgeValue: 0.10,
  conflictResolution: 0.00
};

const UNITY_MULTIPLIER_MAPPING = [
  { minU: 0, maxU: 49, Ux: 0.5 },
  { minU: 50, maxU: 69, Ux: 1.0 },
  { minU: 70, maxU: 84, Ux: 1.5 },
  { minU: 85, maxU: 94, Ux: 2.0 },
  { minU: 95, maxU: 100, Ux: 2.3 }
];

const THRESHOLDS = {
  minLightScore: 60,
  minTruthT: 30,
  minIntegrityK: 0.6,
  antiSybilMin: 0.6,
  auditAmountAtomic: BigInt("5000000000000000000000") // 5000 FUN
};

const CAPS = {
  maxQIProduct: 10.0,
  maxAmountAtomic: BigInt("500000000000000000000000"), // 500K FUN
  minMintAtomic: BigInt("1000000000000000000"), // 1 FUN
  maxUx: 2.5
};

// ===== SCORING FUNCTIONS =====

/**
 * Calculate Light Score from 5 Pillars
 * Formula: 0.25*S + 0.20*T + 0.20*H + 0.20*C + 0.15*U
 */
export function calculateLightScore(pillars: PillarScores): number {
  const score =
    PILLAR_WEIGHTS.S * pillars.S +
    PILLAR_WEIGHTS.T * pillars.T +
    PILLAR_WEIGHTS.H * pillars.H +
    PILLAR_WEIGHTS.C * pillars.C +
    PILLAR_WEIGHTS.U * pillars.U;
  
  return Math.round(score * 100) / 100;
}

/**
 * Calculate Unity Score from Unity Signals
 * Formula: 40*collaboration + 30*beneficiary + 20*endorsement + 10*bridge
 */
export function calculateUnityScore(signals: Partial<UnitySignals>): number {
  let score = 0;
  
  if (signals.collaboration) score += UNITY_WEIGHTS.collaboration * 100;
  if (signals.beneficiaryConfirmed) score += UNITY_WEIGHTS.beneficiaryConfirmed * 100;
  if (signals.communityEndorsement) score += UNITY_WEIGHTS.communityEndorsement * 100;
  if (signals.bridgeValue) score += UNITY_WEIGHTS.bridgeValue * 100;
  if (signals.conflictResolution) score += UNITY_WEIGHTS.conflictResolution * 100;
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate Unity Multiplier (Ux) from Unity Score
 */
export function calculateUnityMultiplier(
  unityScore: number,
  signals?: Partial<UnitySignals>
): number {
  // Base Ux from mapping
  let ux = 0.5;
  for (const range of UNITY_MULTIPLIER_MAPPING) {
    if (unityScore >= range.minU && unityScore <= range.maxU) {
      ux = range.Ux;
      break;
    }
  }
  
  // Apply bonuses
  if (signals?.partnerAttested) {
    ux = Math.min(CAPS.maxUx, ux + 0.3);
  }
  if (signals?.beneficiaryConfirmed) {
    ux = Math.min(CAPS.maxUx, ux + 0.2);
  }
  if (signals?.witnessCount && signals.witnessCount >= 3) {
    ux = Math.min(CAPS.maxUx, ux + 0.2);
  }
  
  return Math.round(ux * 100) / 100;
}

/**
 * Calculate Integrity Multiplier (K)
 * Based on anti-sybil score, stake status, and behavior
 */
export function calculateIntegrityMultiplier(
  antiSybilScore: number,
  hasStake: boolean = false,
  behaviorScore: number = 1.0
): number {
  // Reject if below minimum
  if (antiSybilScore < THRESHOLDS.antiSybilMin) {
    return 0;
  }
  
  let k = antiSybilScore;
  
  // Apply stake boost (max 1.2x)
  if (hasStake) {
    k = Math.min(1.0, k * 1.2);
  }
  
  // Apply behavior boost (max 1.1x)
  k = Math.min(1.0, k * Math.min(1.1, behaviorScore));
  
  return Math.round(k * 100) / 100;
}

/**
 * Calculate final mint amount
 * Formula: amount = baseReward × Q × I × K × Ux
 */
export function calculateMintAmount(
  baseRewardAtomic: string,
  multipliers: Multipliers
): string {
  const br = BigInt(baseRewardAtomic);
  const product = multipliers.Q * multipliers.I * multipliers.K * multipliers.Ux;
  
  // Cap Q×I product
  const qiProduct = multipliers.Q * multipliers.I;
  const cappedProduct = qiProduct > CAPS.maxQIProduct
    ? (CAPS.maxQIProduct / qiProduct) * product
    : product;
  
  // Calculate with precision (×10000, then ÷10000)
  const multiplied = br * BigInt(Math.floor(cappedProduct * 10000)) / BigInt(10000);
  
  // Apply caps
  let result = multiplied;
  if (result > CAPS.maxAmountAtomic) result = CAPS.maxAmountAtomic;
  if (result < CAPS.minMintAtomic) result = CAPS.minMintAtomic;
  
  return result.toString();
}

/**
 * Determine mint decision based on thresholds
 */
export function determineDecision(
  pillars: PillarScores,
  lightScore: number,
  integrityK: number,
  calculatedAmount: bigint
): { decision: MintDecision; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check fraud (K = 0)
  if (integrityK === 0) {
    reasons.push('FRAUD_DETECTED');
    return { decision: 'REJECT', reasons };
  }
  
  // Check global thresholds
  if (lightScore < THRESHOLDS.minLightScore) {
    reasons.push(`Light Score ${lightScore} < ${THRESHOLDS.minLightScore}`);
  }
  
  if (pillars.T < THRESHOLDS.minTruthT) {
    reasons.push(`Truth Score ${pillars.T} < ${THRESHOLDS.minTruthT}`);
  }
  
  if (integrityK < THRESHOLDS.minIntegrityK) {
    reasons.push(`Integrity K ${integrityK} < ${THRESHOLDS.minIntegrityK}`);
  }
  
  if (reasons.length > 0) {
    return { decision: 'REJECT', reasons };
  }
  
  // Check audit trigger
  if (calculatedAmount >= THRESHOLDS.auditAmountAtomic) {
    reasons.push('AUDIT_TRIGGERED_LARGE_MINT');
    return { decision: 'REVIEW_HOLD', reasons };
  }
  
  return { decision: 'AUTHORIZE', reasons: [] };
}

// ===== MAIN SCORING FUNCTION =====

export interface ScoringInput {
  platformId: string;
  actionType: string;
  pillarScores: PillarScores;
  unitySignals: Partial<UnitySignals>;
  antiSybilScore: number;
  hasStake?: boolean;
  behaviorScore?: number;
  baseRewardAtomic: string;
  qualityMultiplier?: number;
  impactMultiplier?: number;
  /** PPLP v2.0 validation — nếu cung cấp, sẽ kiểm tra 5 điều kiện bắt buộc trước khi tính toán */
  pplpValidation?: import('./constitution').PPLPValidation;
  /** LS-Math v1.0: streak days for consistency multiplier */
  streakDays?: number;
  /** LS-Math v1.0: sequence bonus total for sequence multiplier */
  sequenceBonus?: number;
  /** LS-Math v1.0: risk score for integrity penalty (0-1) */
  riskScore?: number;
}

/**
 * Full scoring pipeline
 * Constitution v2.0: kiểm tra PPLP Validation trước khi tính toán
 */
export function scoreAction(input: ScoringInput): ScoringResult {
  // PPLP v2.0 — 5 điều kiện bắt buộc (Chương III Constitution v2.0)
  if (input.pplpValidation) {
    const { validatePPLP } = require('./constitution') as typeof import('./constitution');
    const { valid, failedConditions } = validatePPLP(input.pplpValidation);
    if (!valid) {
      return {
        lightScore: 0,
        unityScore: 0,
        multipliers: { Q: 0, I: 0, K: 0, Ux: 0 },
        baseRewardAtomic: input.baseRewardAtomic,
        calculatedAmountAtomic: '0',
        calculatedAmountFormatted: '0 FUN',
        decision: 'REJECT',
        reasonCodes: failedConditions.map(c => `PPLP_FAILED:${c}`),
      };
    }
  }

  // Calculate scores
  const lightScore = calculateLightScore(input.pillarScores);
  const unityScore = calculateUnityScore(input.unitySignals);
  
  // Calculate multipliers
  const K = calculateIntegrityMultiplier(
    input.antiSybilScore,
    input.hasStake,
    input.behaviorScore
  );
  const Ux = calculateUnityMultiplier(unityScore, input.unitySignals);
  
  // Q and I can be provided or use defaults
  const Q = input.qualityMultiplier ?? 1.5;
  const I = input.impactMultiplier ?? 1.5;
  
  const multipliers: Multipliers = {
    Q: Math.round(Q * 100) / 100,
    I: Math.round(I * 100) / 100,
    K,
    Ux
  };
  
  // LS-Math v1.0: Apply consistency, sequence, and integrity multipliers
  const mCons = calculateConsistencyMultiplier(input.streakDays ?? 0);
  const mSeq = 1 + 0.5 * Math.tanh((input.sequenceBonus ?? 0) / 5);
  const integrityPenalty = 1 - Math.min(0.5, 0.8 * (input.riskScore ?? 0));
  const lsMathFactor = Math.round(mCons * mSeq * integrityPenalty * 10000) / 10000;

  // Calculate amount with LS-Math factor applied
  const baseAmountAtomic = calculateMintAmount(input.baseRewardAtomic, multipliers);
  const baseAmount = BigInt(baseAmountAtomic);
  const scaledAmount = baseAmount * BigInt(Math.floor(lsMathFactor * 10000)) / BigInt(10000);
  const calculatedAmountAtomic = scaledAmount.toString();
  
  // Determine decision
  const { decision, reasons } = determineDecision(
    input.pillarScores,
    lightScore,
    K,
    BigInt(calculatedAmountAtomic)
  );
  
  return {
    lightScore,
    unityScore,
    multipliers,
    baseRewardAtomic: input.baseRewardAtomic,
    calculatedAmountAtomic: decision === 'AUTHORIZE' ? calculatedAmountAtomic : '0',
    calculatedAmountFormatted: formatFunAmount(calculatedAmountAtomic),
    decision,
    reasonCodes: reasons
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format atomic amount to human readable
 */
export function formatFunAmount(atomicAmount: string): string {
  const value = BigInt(atomicAmount);
  const decimals = 18n;
  const whole = value / (10n ** decimals);
  const fraction = value % (10n ** decimals);
  
  if (fraction === 0n) {
    return `${whole.toString()} FUN`;
  }
  
  const fractionStr = fraction.toString().padStart(18, '0').slice(0, 2);
  return `${whole.toString()}.${fractionStr} FUN`;
}

/**
 * Parse FUN amount string to atomic
 */
export function parseFunAmount(funAmount: string): string {
  const match = funAmount.match(/^(\d+)(?:\.(\d+))?\s*FUN?$/i);
  if (!match) throw new Error('Invalid FUN amount format');
  
  const whole = match[1];
  const fraction = (match[2] || '').padEnd(18, '0').slice(0, 18);
  
  return BigInt(whole + fraction).toString();
}

// ===== BASE REWARDS BY ACTION =====

export const BASE_REWARDS: Record<string, Record<string, string>> = {
  ANGEL_AI: {
    AI_REVIEW_HELPFUL: "50000000000000000000",
    FRAUD_REPORT_VALID: "120000000000000000000",
    MODERATION_HELP: "60000000000000000000",
    MODEL_IMPROVEMENT: "150000000000000000000"
  },
  FUN_PROFILE: {
    CONTENT_CREATE: "70000000000000000000",
    CONTENT_REVIEW: "40000000000000000000",
    MENTOR_HELP: "150000000000000000000",
    COMMUNITY_BUILD: "120000000000000000000"
  },
  FUN_CHARITY: {
    DONATE: "120000000000000000000",
    VOLUNTEER: "150000000000000000000",
    CAMPAIGN_DELIVERY_PROOF: "250000000000000000000",
    IMPACT_REPORT: "120000000000000000000"
  },
  FUN_EARTH: {
    TREE_PLANT: "100000000000000000000",
    CLEANUP_EVENT: "80000000000000000000",
    PARTNER_VERIFIED_REPORT: "100000000000000000000"
  },
  FUN_ACADEMY: {
    LEARN_COMPLETE: "80000000000000000000",
    PROJECT_SUBMIT: "150000000000000000000",
    MENTOR_HELP: "120000000000000000000",
    PEER_REVIEW: "60000000000000000000"
  },
  FUN_PLAY: {
    WATCH_VIDEO: "10000000000000000000",
    LIKE_VIDEO: "5000000000000000000",
    COMMENT: "15000000000000000000",
    SHARE: "20000000000000000000",
    UPLOAD_VIDEO: "100000000000000000000",
    SIGNUP: "10000000000000000000",
    WALLET_CONNECT: "5000000000000000000",
    CREATE_POST: "30000000000000000000"
  },
  FUN_PLANET: {
    COMMUNITY_ACTION: "80000000000000000000",
    SOCIAL_IMPACT: "120000000000000000000",
    SUSTAINABILITY_REPORT: "150000000000000000000"
  }
};

// ===== LIGHT LEVEL HELPERS =====

const LIGHT_LEVELS: Record<string, { label: string; emoji: string }> = {
  seed: { label: 'Light Seed', emoji: '🌱' },
  presence: { label: 'Light Seed', emoji: '🌱' }, // legacy alias
  sprout: { label: 'Light Sprout', emoji: '🌿' },
  contributor: { label: 'Light Sprout', emoji: '🌿' }, // legacy alias
  builder: { label: 'Light Builder', emoji: '🌳' },
  guardian: { label: 'Light Guardian', emoji: '🛡️' },
  architect: { label: 'Light Architect', emoji: '👑' },
};

export function getLightLevelLabel(level: string): string {
  return LIGHT_LEVELS[level]?.label || 'Light Presence';
}

export function getLightLevelEmoji(level: string): string {
  return LIGHT_LEVELS[level]?.emoji || '🌱';
}

/**
 * LS-Math v1.0: Logarithmic reputation weight
 * w = clip(0.5, 2.0, 1 + 0.25 * log(1 + R_u))
 */
export function calculateReputationWeight(
  accountAgeDays: number,
  suspiciousScore: number,
  hasApprovedContent: boolean,
  hasDonations: boolean
): number {
  // R_u based on account age in months + bonuses
  let reputation = accountAgeDays / 30;
  if (suspiciousScore === 0) reputation += 1;
  if (hasApprovedContent) reputation += 1;
  if (hasDonations) reputation += 1;

  const raw = 1 + 0.25 * Math.log(1 + reputation);
  return Math.max(0.5, Math.min(2.0, Math.round(raw * 100) / 100));
}

/**
 * LS-Math v1.0: Exponential consistency multiplier
 * M_cons = 1 + 0.6 * (1 - e^(-S/30))
 */
export function calculateConsistencyMultiplier(activeDays: number): number {
  return Math.round((1 + 0.6 * (1 - Math.exp(-activeDays / 30))) * 10000) / 10000;
}

/**
 * LS-Math v1.0: Content Pillar Score
 * C_u(t) = Σ ρ(type) * (P_c/10)^1.3
 */
export function calculateContentPillarScore(
  pillarTotal: number,
  contentTypeWeight: number = 1.0
): number {
  const h = Math.pow(Math.min(pillarTotal / 10, 1), 1.3);
  return Math.round(contentTypeWeight * h * 10000) / 10000;
}

/**
 * LS-Math v1.0: Action Base Score
 * B_u(t) = Σ b_τ * g(x)
 */
export function calculateActionBaseScore(
  events: { baseScore: number; qualityAdjustment?: number }[]
): number {
  let B = 0;
  for (const e of events) {
    const g = Math.max(0, Math.min(1.5, e.qualityAdjustment ?? 1.0));
    B += e.baseScore * g;
  }
  return Math.round(B * 10000) / 10000;
}

/**
 * LS-Math v1.0: Daily Light Score
 * L = (0.4*B + 0.6*C) * M_cons * M_seq * Π
 */
export function calculateDailyLightScore(
  actionBase: number,
  contentScore: number,
  streakDays: number,
  sequenceBonus: number,
  riskScore: number
): { rawScore: number; finalScore: number } {
  const rawScore = 0.4 * actionBase + 0.6 * contentScore;
  const mCons = calculateConsistencyMultiplier(streakDays);
  const mSeq = 1 + 0.5 * Math.tanh(sequenceBonus / 5);
  const integrity = 1 - Math.min(0.5, 0.8 * riskScore);
  const finalScore = Math.round(rawScore * mCons * mSeq * integrity * 10000) / 10000;
  return { rawScore: Math.round(rawScore * 10000) / 10000, finalScore };
}

/**
 * Get base reward for an action
 */
export function getBaseReward(platformId: string, actionType: string): string {
  const platform = BASE_REWARDS[platformId];
  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }
  
  const reward = platform[actionType];
  if (!reward) {
    throw new Error(`Unknown action: ${actionType} for platform ${platformId}`);
  }
  
  return reward;
}
