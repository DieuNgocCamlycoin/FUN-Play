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

export type MintDecision = 'AUTHORIZE' | 'REJECT' | 'REVIEW_HOLD';

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
  minTruthT: 70,
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
}

/**
 * Full scoring pipeline
 */
export function scoreAction(input: ScoringInput): ScoringResult {
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
  
  // Calculate amount
  const calculatedAmountAtomic = calculateMintAmount(input.baseRewardAtomic, multipliers);
  
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
    UPLOAD_VIDEO: "100000000000000000000"
  },
  FUN_PLANET: {
    COMMUNITY_ACTION: "80000000000000000000",
    SOCIAL_IMPACT: "120000000000000000000",
    SUSTAINABILITY_REPORT: "150000000000000000000"
  }
};

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
