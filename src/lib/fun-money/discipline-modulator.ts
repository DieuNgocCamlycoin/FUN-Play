/**
 * Discipline Modulator & Anti-Farming Timing Model
 * 
 * Implements guardrails 1-8 and timing defenses
 */

// ─── Anti-Farming Timing Factors ─────────────────────────────

export interface TimingFactors {
  activeDaysInWindow: number;
  totalDaysInWindow: number;
  accountAgeDays: number;
  windowsCompleted: number;   // how many full windows user has been through
  burstActivityCount: number; // same-type actions in short timeframe
  normalActivityCount: number;
  lateWindowActivityPct: number; // % of activity in last 48h of window
}

export interface TimingAdjustedResult {
  consistencyFactor: number;
  burstPenaltyFactor: number;
  trustRampFactor: number;
  crossWindowContinuityFactor: number;
  lateWindowSuppression: number;
  combinedFactor: number;
}

/**
 * ConsistencyFactor = active_days / total_days
 */
export function calculateConsistencyFactor(activeDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.min(1, activeDays / totalDays);
}

/**
 * Burst Penalty — diminishing returns for same-type activity spikes
 * If burst > normal * 2, apply penalty
 */
export function calculateBurstPenalty(burstCount: number, normalCount: number): number {
  if (normalCount <= 0 || burstCount <= 0) return 1.0;
  const ratio = burstCount / Math.max(1, normalCount);
  if (ratio <= 1.5) return 1.0;       // Normal range
  if (ratio <= 3.0) return 0.85;      // Mild penalty
  if (ratio <= 5.0) return 0.65;      // Moderate penalty
  return 0.4;                          // Severe penalty
}

/**
 * Trust Ramp — new users start lower, ramp over 2 windows
 * Full trust after ~56 days (2 × 28-day windows)
 */
export function calculateTrustRamp(accountAgeDays: number, windowsCompleted: number): number {
  if (windowsCompleted >= 2 && accountAgeDays >= 56) return 1.0;
  if (windowsCompleted >= 1 && accountAgeDays >= 28) return 0.75;
  if (accountAgeDays >= 14) return 0.5;
  return 0.3; // Brand new
}

/**
 * Cross-Window Continuity — bonus for sustained multi-window activity
 */
export function calculateCrossWindowContinuity(windowsCompleted: number, consistencyFactor: number): number {
  if (windowsCompleted <= 0) return 1.0;
  // Up to 20% bonus for long-term consistency
  const bonus = Math.min(0.2, windowsCompleted * 0.04 * consistencyFactor);
  return 1.0 + bonus;
}

/**
 * Late-window suppression — reduce weight of last 48h activity
 */
export function calculateLateWindowSuppression(lateWindowActivityPct: number): number {
  if (lateWindowActivityPct <= 0.3) return 1.0; // Normal distribution
  if (lateWindowActivityPct <= 0.5) return 0.95;
  if (lateWindowActivityPct <= 0.7) return 0.85;
  return 0.7; // Heavily back-loaded → strong suppression
}

/**
 * Combined timing-adjusted score
 */
export function calculateTimingAdjustedFactors(input: TimingFactors): TimingAdjustedResult {
  const consistencyFactor = calculateConsistencyFactor(input.activeDaysInWindow, input.totalDaysInWindow);
  const burstPenaltyFactor = calculateBurstPenalty(input.burstActivityCount, input.normalActivityCount);
  const trustRampFactor = calculateTrustRamp(input.accountAgeDays, input.windowsCompleted);
  const crossWindowContinuityFactor = calculateCrossWindowContinuity(input.windowsCompleted, consistencyFactor);
  const lateWindowSuppression = calculateLateWindowSuppression(input.lateWindowActivityPct);

  const combinedFactor =
    consistencyFactor *
    burstPenaltyFactor *
    trustRampFactor *
    crossWindowContinuityFactor *
    lateWindowSuppression;

  return {
    consistencyFactor: round4(consistencyFactor),
    burstPenaltyFactor: round4(burstPenaltyFactor),
    trustRampFactor: round4(trustRampFactor),
    crossWindowContinuityFactor: round4(crossWindowContinuityFactor),
    lateWindowSuppression: round4(lateWindowSuppression),
    combinedFactor: round4(combinedFactor),
  };
}

// ─── Per-User Emission Guard (Guardrail 3) ───────────────────

export interface EmissionGuard {
  maxEmission: number;
  band: 'new' | 'standard' | 'trusted' | 'veteran';
}

const EMISSION_BAND_MULTIPLIERS: Record<string, number> = {
  new: 0.5,
  standard: 1.0,
  trusted: 1.5,
  veteran: 2.0,
};

export function calculateEmissionGuard(
  trustBand: string,
  baseEmissionCap: number
): EmissionGuard {
  const multiplier = EMISSION_BAND_MULTIPLIERS[trustBand] ?? 1.0;
  return {
    maxEmission: Math.round(baseEmissionCap * multiplier * 100) / 100,
    band: (trustBand as EmissionGuard['band']),
  };
}

// ─── Fraud Pressure Suppression (Guardrail 6) ────────────────

export interface FraudSuppressionResult {
  rewardWeightMultiplier: number;
  lockRatioAdjustment: number;    // additional lock %
  instantPortionAdjustment: number; // reduction in instant %
  disciplineReduction: number;
}

export function calculateFraudSuppression(fraudPressureRatio: number): FraudSuppressionResult {
  if (fraudPressureRatio <= 0.05) {
    return { rewardWeightMultiplier: 1.0, lockRatioAdjustment: 0, instantPortionAdjustment: 0, disciplineReduction: 0 };
  }
  if (fraudPressureRatio <= 0.15) {
    return { rewardWeightMultiplier: 0.95, lockRatioAdjustment: 0.05, instantPortionAdjustment: -0.03, disciplineReduction: 0.05 };
  }
  if (fraudPressureRatio <= 0.30) {
    return { rewardWeightMultiplier: 0.80, lockRatioAdjustment: 0.10, instantPortionAdjustment: -0.05, disciplineReduction: 0.10 };
  }
  // Severe fraud
  return { rewardWeightMultiplier: 0.50, lockRatioAdjustment: 0.20, instantPortionAdjustment: -0.10, disciplineReduction: 0.20 };
}

// ─── Health Ratios (Guardrail 7) ─────────────────────────────

export interface HealthRatios {
  valueExpansionRatio: number;     // verified_value_growth / supply_growth
  utilityAbsorptionRatio: number;  // ecosystem_FUN_used / newly_unlocked
  retentionQualityRatio: number;   // quality_active / total_claiming
  fraudPressureRatio: number;      // flagged / total
  lockedStabilityRatio: number;    // locked / circulating
}

export function assessSystemHealth(ratios: HealthRatios): {
  healthy: boolean;
  warnings: string[];
  safeModeRequired: boolean;
} {
  const warnings: string[] = [];
  let safeModeRequired = false;

  if (ratios.valueExpansionRatio < 0.5) {
    warnings.push('Supply growing faster than verified value');
  }
  if (ratios.utilityAbsorptionRatio < 0.3) {
    warnings.push('Low utility absorption — FUN not being used after unlock');
  }
  if (ratios.retentionQualityRatio < 0.4) {
    warnings.push('Low quality retention — many claimers are not quality users');
  }
  if (ratios.fraudPressureRatio > 0.2) {
    warnings.push('High fraud pressure detected');
  }
  if (ratios.lockedStabilityRatio < 0.4) {
    warnings.push('Low locked ratio — too much circulating');
  }

  // Safe mode: multiple critical warnings
  const criticalCount = [
    ratios.valueExpansionRatio < 0.3,
    ratios.fraudPressureRatio > 0.3,
    ratios.utilityAbsorptionRatio < 0.15,
  ].filter(Boolean).length;

  if (criticalCount >= 2) {
    safeModeRequired = true;
    warnings.push('SAFE MODE RECOMMENDED: Multiple critical thresholds breached');
  }

  return {
    healthy: warnings.length === 0,
    warnings,
    safeModeRequired,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
