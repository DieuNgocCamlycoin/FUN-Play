/**
 * FUN Monetary Expansion Engine v1.0
 * 
 * TotalMint = BaseExpansion + ContributionExpansion + EcosystemExpansion
 * AdjustedMint = TotalMint × DisciplineModulator
 * FinalMint = clamp(MinEpochMint, AdjustedMint, MaxEpochMintPolicy)
 */

// ─── Types ───────────────────────────────────────────────────

export interface EpochConfig {
  // Base expansion
  baseRate: number;           // FUN per epoch base
  epochLengthDays: number;    // actual epoch length
  standardEpochDays: number;  // reference (28)
  systemStage: 'bootstrap' | 'growth' | 'mature';

  // Contribution weights (α, β, γ)
  alpha: number;  // weight for VerifiedLightScore
  beta: number;   // weight for ContributionValue
  gamma: number;  // weight for ServiceImpactScore

  // Ecosystem weights (δ, ε, ζ)
  delta: number;  // weight for UsageIndex
  epsilon: number; // weight for ActiveQualityUserCount
  zeta: number;   // weight for UtilityDiversityIndex

  // Guardrails
  minEpochMint: number;
  maxEpochMintPolicy: number;
  disciplineModulatorMin: number; // 0.65
  disciplineModulatorMax: number; // 1.25

  // Allocation split
  userRewardPoolPct: number;      // 0.70
  ecosystemPoolPct: number;       // 0.12
  treasuryPoolPct: number;        // 0.10
  strategicGrowthPoolPct: number; // 0.05
  resilienceReservePct: number;   // 0.03

  // Vesting
  instantPortion: number;  // 0.15
  lockedPortion: number;   // 0.85
}

export interface EpochInputMetrics {
  totalVerifiedLightScore: number;
  totalContributionValue: number;
  serviceImpactScore: number;
  ecosystemUsageIndex: number;
  activeQualityUserCount: number;
  utilityDiversityIndex: number;
}

export interface DisciplineInputs {
  liquidityDisciplineIndex: number;  // 0-1: locked ratio, in-system retention
  fraudPressureIndex: number;        // 0-1: flagged/total activity
  claimEfficiencyIndex: number;      // 0-1: used_after_claim / total_claimed
  utilityRetentionIndex: number;     // 0-1: FUN used in ecosystem / newly unlocked
}

export interface MintExpansionResult {
  baseExpansion: number;
  contributionExpansion: number;
  ecosystemExpansion: number;
  totalMint: number;
  disciplineModulator: number;
  adjustedMint: number;
  finalMint: number;
  guardrailFlags: string[];
  allocation: MintAllocation;
}

export interface MintAllocation {
  userRewardPool: number;
  ecosystemPool: number;
  treasuryPool: number;
  strategicGrowthPool: number;
  resilienceReserve: number;
}

export interface UserWeightedScoreInput {
  pplpScore: number;
  trustFactor: number;
  consistencyFactor: number;
  utilityParticipationFactor: number;
}

// ─── Default Config ──────────────────────────────────────────

export const DEFAULT_EPOCH_CONFIG: EpochConfig = {
  baseRate: 500_000,
  epochLengthDays: 28,
  standardEpochDays: 28,
  systemStage: 'bootstrap',

  alpha: 1000,
  beta: 800,
  gamma: 600,

  delta: 500,
  epsilon: 100,
  zeta: 300,

  minEpochMint: 100_000,
  maxEpochMintPolicy: 20_000_000,
  disciplineModulatorMin: 0.65,
  disciplineModulatorMax: 1.25,

  userRewardPoolPct: 0.70,
  ecosystemPoolPct: 0.12,
  treasuryPoolPct: 0.10,
  strategicGrowthPoolPct: 0.05,
  resilienceReservePct: 0.03,

  instantPortion: 0.15,
  lockedPortion: 0.85,
};

// ─── System Stage Factors ────────────────────────────────────

const SYSTEM_STAGE_FACTORS: Record<string, number> = {
  bootstrap: 1.5,  // Higher base during bootstrap
  growth: 1.0,
  mature: 0.6,     // Lower base, contribution-driven
};

// ─── Core Engine ─────────────────────────────────────────────

export function calculateBaseExpansion(config: EpochConfig): number {
  const epochLengthFactor = config.epochLengthDays / config.standardEpochDays;
  const stageFactor = SYSTEM_STAGE_FACTORS[config.systemStage] ?? 1.0;
  return config.baseRate * epochLengthFactor * stageFactor;
}

export function calculateContributionExpansion(
  config: EpochConfig,
  metrics: EpochInputMetrics
): number {
  // Nonlinear normalization to prevent whale/spam dominance
  const normalizedLight = Math.log(1 + metrics.totalVerifiedLightScore);
  const normalizedContribution = Math.sqrt(1 + metrics.totalContributionValue);
  const serviceImpact = Math.min(metrics.serviceImpactScore, 100); // soft cap

  return (
    config.alpha * normalizedLight +
    config.beta * normalizedContribution +
    config.gamma * serviceImpact
  );
}

export function calculateEcosystemExpansion(
  config: EpochConfig,
  metrics: EpochInputMetrics
): number {
  return (
    config.delta * metrics.ecosystemUsageIndex +
    config.epsilon * metrics.activeQualityUserCount +
    config.zeta * metrics.utilityDiversityIndex
  );
}

export function calculateDisciplineModulator(
  inputs: DisciplineInputs,
  config: EpochConfig
): { modulator: number; flags: string[] } {
  const flags: string[] = [];

  // Each sub-index contributes to the modulator
  // Higher discipline → higher modulator (up to 1.25)
  // Lower discipline → lower modulator (down to 0.65)
  const raw =
    0.30 * inputs.liquidityDisciplineIndex +
    0.25 * (1 - inputs.fraudPressureIndex) +  // invert: low fraud = good
    0.25 * inputs.claimEfficiencyIndex +
    0.20 * inputs.utilityRetentionIndex;

  // Map [0,1] → [min, max]
  const range = config.disciplineModulatorMax - config.disciplineModulatorMin;
  let modulator = config.disciplineModulatorMin + raw * range;

  // Guardrail flags
  if (inputs.fraudPressureIndex > 0.3) {
    flags.push('high_fraud_pressure');
  }
  if (inputs.liquidityDisciplineIndex < 0.3) {
    flags.push('low_liquidity_discipline');
  }
  if (inputs.claimEfficiencyIndex < 0.2) {
    flags.push('low_claim_efficiency');
  }
  if (inputs.utilityRetentionIndex < 0.2) {
    flags.push('low_utility_retention');
  }

  // Clamp
  modulator = Math.max(config.disciplineModulatorMin, Math.min(config.disciplineModulatorMax, modulator));

  return { modulator, flags };
}

export function calculateTotalMint(
  config: EpochConfig,
  metrics: EpochInputMetrics,
  disciplineInputs: DisciplineInputs
): MintExpansionResult {
  const guardrailFlags: string[] = [];

  const baseExpansion = calculateBaseExpansion(config);
  const contributionExpansion = calculateContributionExpansion(config, metrics);
  const ecosystemExpansion = calculateEcosystemExpansion(config, metrics);
  const totalMint = baseExpansion + contributionExpansion + ecosystemExpansion;

  // Guardrail 4: Utility coupling — if usage is too low, suppress ecosystem expansion
  let effectiveEcosystem = ecosystemExpansion;
  if (metrics.ecosystemUsageIndex < 0.1) {
    effectiveEcosystem *= 0.3;
    guardrailFlags.push('ecosystem_suppressed_low_usage');
  }
  const effectiveTotal = baseExpansion + contributionExpansion + effectiveEcosystem;

  const { modulator, flags: disciplineFlags } = calculateDisciplineModulator(disciplineInputs, config);
  guardrailFlags.push(...disciplineFlags);

  const adjustedMint = effectiveTotal * modulator;

  // Clamp to policy bounds
  let finalMint = Math.max(config.minEpochMint, Math.min(config.maxEpochMintPolicy, adjustedMint));

  if (adjustedMint > config.maxEpochMintPolicy) {
    guardrailFlags.push('capped_by_max_epoch_policy');
  }
  if (adjustedMint < config.minEpochMint) {
    guardrailFlags.push('floored_by_min_epoch_mint');
  }

  // Round
  finalMint = Math.round(finalMint * 100) / 100;

  const allocation = allocateMint(finalMint, config);

  return {
    baseExpansion: Math.round(baseExpansion * 100) / 100,
    contributionExpansion: Math.round(contributionExpansion * 100) / 100,
    ecosystemExpansion: Math.round(ecosystemExpansion * 100) / 100,
    totalMint: Math.round(totalMint * 100) / 100,
    disciplineModulator: Math.round(modulator * 10000) / 10000,
    adjustedMint: Math.round(adjustedMint * 100) / 100,
    finalMint,
    guardrailFlags,
    allocation,
  };
}

// ─── Allocation Split ────────────────────────────────────────

function allocateMint(finalMint: number, config: EpochConfig): MintAllocation {
  return {
    userRewardPool: Math.round(finalMint * config.userRewardPoolPct * 100) / 100,
    ecosystemPool: Math.round(finalMint * config.ecosystemPoolPct * 100) / 100,
    treasuryPool: Math.round(finalMint * config.treasuryPoolPct * 100) / 100,
    strategicGrowthPool: Math.round(finalMint * config.strategicGrowthPoolPct * 100) / 100,
    resilienceReserve: Math.round(finalMint * config.resilienceReservePct * 100) / 100,
  };
}

// ─── Per-User Allocation ─────────────────────────────────────

export function calculateUserWeightedScore(input: UserWeightedScoreInput): number {
  return input.pplpScore * input.trustFactor * input.consistencyFactor * input.utilityParticipationFactor;
}

export function calculateUserMint(
  userWeightedScore: number,
  sumAllEligibleWeightedScores: number,
  userRewardPool: number,
  maxSharePerUser: number = 0.03
): { userMint: number; capped: boolean } {
  if (sumAllEligibleWeightedScores <= 0) return { userMint: 0, capped: false };

  const rawMint = userRewardPool * (userWeightedScore / sumAllEligibleWeightedScores);
  const maxAmount = userRewardPool * maxSharePerUser;

  if (rawMint > maxAmount) {
    return { userMint: Math.round(maxAmount * 100) / 100, capped: true };
  }

  return { userMint: Math.round(rawMint * 100) / 100, capped: false };
}

// ─── Vesting Split ───────────────────────────────────────────

export interface VestingSplit {
  instantAmount: number;
  lockedAmount: number;
}

export function calculateVestingSplit(
  totalUserMint: number,
  trustBand: 'new' | 'standard' | 'trusted' | 'veteran',
  config: EpochConfig
): VestingSplit {
  // Trust band adjusts instant portion
  const trustBandAdjustments: Record<string, number> = {
    new: -0.05,      // 10% instant
    standard: 0,     // 15% instant
    trusted: 0.05,   // 20% instant
    veteran: 0.10,   // 25% instant
  };

  const adjustment = trustBandAdjustments[trustBand] ?? 0;
  const instantPct = Math.max(0.10, Math.min(0.25, config.instantPortion + adjustment));
  const lockedPct = 1 - instantPct;

  return {
    instantAmount: Math.round(totalUserMint * instantPct * 100) / 100,
    lockedAmount: Math.round(totalUserMint * lockedPct * 100) / 100,
  };
}

// ─── Trust Band Classification ───────────────────────────────

export function classifyTrustBand(
  accountAgeDays: number,
  consistencyDays: number,
  lightScore: number,
  fraudScore: number
): 'new' | 'standard' | 'trusted' | 'veteran' {
  if (fraudScore > 0.3) return 'new'; // Suspected fraud → lowest band
  if (accountAgeDays < 30 || consistencyDays < 7) return 'new';
  if (accountAgeDays >= 180 && consistencyDays >= 60 && lightScore >= 500) return 'veteran';
  if (accountAgeDays >= 90 && consistencyDays >= 30 && lightScore >= 200) return 'trusted';
  return 'standard';
}
