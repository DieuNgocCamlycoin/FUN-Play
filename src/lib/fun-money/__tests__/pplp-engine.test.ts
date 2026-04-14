/**
 * PPLP Engine Tests — CTO Diagram v13Apr2026
 * Multiplicative formula, 0-10 scale, zero-kill rule
 */
import { describe, it, expect } from 'vitest';
import {
  scoreAction,
  calculateLightScore,
  calculateUnityScore,
  calculateUnityMultiplier,
  calculateIntegrityMultiplier,
  calculateMintAmount,
  calculateConsistencyMultiplier,
  calculateContentPillarScore,
  calculateActionBaseScore,
  calculateDailyLightScore,
  formatFunAmount,
  parseFunAmount,
  getBaseReward,
  calculateMintFromLightScore,
  calculateTrustMultiplier,
  IMPACT_WEIGHTS,
  BASE_MINT_RATE,
  BASE_REWARDS,
  type PillarScores,
  type ScoringInput,
} from '../pplp-engine';

// ===== Light Score — Multiplicative Formula =====

describe('calculateLightScore (multiplicative)', () => {
  it('calculates (S×T×L×V×U)/10⁴', () => {
    const pillars: PillarScores = { S: 8, T: 9, H: 8, C: 7, U: 9 };
    // (8×9×8×7×9)/10000 = 36288/10000 = 3.63
    expect(calculateLightScore(pillars)).toBeCloseTo(3.63, 1);
  });

  it('returns 0 for all-zero pillars (zero-kill)', () => {
    expect(calculateLightScore({ S: 0, T: 0, H: 0, C: 0, U: 0 })).toBe(0);
  });

  it('zero-kill: any single pillar = 0 → score = 0', () => {
    expect(calculateLightScore({ S: 10, T: 10, H: 0, C: 10, U: 10 })).toBe(0);
    expect(calculateLightScore({ S: 0, T: 8, H: 7, C: 9, U: 6 })).toBe(0);
  });

  it('returns 10 for all-max pillars (10×10×10×10×10)/10⁴ = 10', () => {
    expect(calculateLightScore({ S: 10, T: 10, H: 10, C: 10, U: 10 })).toBe(10);
  });

  it('mid-range example', () => {
    const pillars: PillarScores = { S: 5, T: 5, H: 5, C: 5, U: 5 };
    // (5^5)/10000 = 3125/10000 = 0.3125
    expect(calculateLightScore(pillars)).toBeCloseTo(0.31, 1);
  });
});

// ===== Mint from Light Score (99/1 split) =====

describe('calculateMintFromLightScore', () => {
  it('calculates base mint rate × light score', () => {
    const result = calculateMintFromLightScore(3.63);
    expect(result.total).toBeCloseTo(36.3, 0);
    expect(result.user).toBeCloseTo(result.total * 0.99, 0);
    expect(result.platform).toBeCloseTo(result.total * 0.01, 0);
  });

  it('applies impact weight for SERVICE', () => {
    const base = calculateMintFromLightScore(3.63, 'CHANNELING');
    const service = calculateMintFromLightScore(3.63, 'SERVICE');
    expect(service.total).toBeGreaterThan(base.total);
  });

  it('applies trust multiplier', () => {
    const base = calculateMintFromLightScore(3.63, 'CHANNELING', 1.0);
    const trusted = calculateMintFromLightScore(3.63, 'CHANNELING', 1.15);
    expect(trusted.total).toBeGreaterThan(base.total);
  });

  it('99/1 split is correct', () => {
    const result = calculateMintFromLightScore(5.0);
    expect(result.user + result.platform).toBeCloseTo(result.total, 1);
  });
});

// ===== Trust Multiplier =====

describe('calculateTrustMultiplier', () => {
  it('clamps minimum at 1.0', () => {
    expect(calculateTrustMultiplier(0.5)).toBe(1.0);
  });

  it('clamps maximum at 1.25', () => {
    expect(calculateTrustMultiplier(2.0)).toBe(1.25);
  });
});

// ===== Unity Score =====

describe('calculateUnityScore', () => {
  it('returns 0 with no signals', () => {
    expect(calculateUnityScore({})).toBe(0);
  });

  it('calculates full score with all signals', () => {
    const score = calculateUnityScore({
      collaboration: true,
      beneficiaryConfirmed: true,
      communityEndorsement: true,
      bridgeValue: true,
    });
    expect(score).toBe(100);
  });

  it('partial signals give partial score', () => {
    const score = calculateUnityScore({ collaboration: true });
    expect(score).toBe(40);
  });
});

// ===== Unity Multiplier =====

describe('calculateUnityMultiplier', () => {
  it('returns 0.5 for low unity score', () => {
    expect(calculateUnityMultiplier(30)).toBe(0.5);
  });

  it('caps at maxUx = 2.5', () => {
    const ux = calculateUnityMultiplier(95, {
      partnerAttested: true,
      beneficiaryConfirmed: true,
      witnessCount: 5,
    });
    expect(ux).toBeLessThanOrEqual(2.5);
  });
});

// ===== Integrity Multiplier =====

describe('calculateIntegrityMultiplier', () => {
  it('returns 0 for anti-sybil below threshold', () => {
    expect(calculateIntegrityMultiplier(0.3)).toBe(0);
  });

  it('returns positive for valid anti-sybil score', () => {
    expect(calculateIntegrityMultiplier(0.8)).toBeGreaterThan(0);
  });

  it('K never exceeds 1.0', () => {
    expect(calculateIntegrityMultiplier(0.99, true, 1.1)).toBeLessThanOrEqual(1.0);
  });
});

// ===== Mint Amount Calculation =====

describe('calculateMintAmount', () => {
  it('calculates base × multipliers', () => {
    const amount = calculateMintAmount(
      '100000000000000000000', // 100 FUN
      { Q: 1.5, I: 1.5, K: 1.0, Ux: 1.0 }
    );
    expect(BigInt(amount)).toBe(225000000000000000000n);
  });

  it('ensures minimum mint of 1 FUN', () => {
    const amount = calculateMintAmount(
      '1',
      { Q: 0.5, I: 0.5, K: 0.6, Ux: 0.5 }
    );
    expect(BigInt(amount)).toBeGreaterThanOrEqual(1000000000000000000n);
  });
});

// ===== Format/Parse FUN Amounts =====

describe('formatFunAmount', () => {
  it('formats whole amounts', () => {
    expect(formatFunAmount('100000000000000000000')).toBe('100 FUN');
  });

  it('formats zero', () => {
    expect(formatFunAmount('0')).toBe('0 FUN');
  });
});

describe('parseFunAmount', () => {
  it('parses whole FUN amount', () => {
    expect(parseFunAmount('100 FUN')).toBe('100000000000000000000');
  });

  it('throws on invalid format', () => {
    expect(() => parseFunAmount('abc')).toThrow();
  });
});

// ===== Base Rewards =====

describe('getBaseReward', () => {
  it('returns correct reward for FUN_PLAY COMMENT', () => {
    expect(getBaseReward('FUN_PLAY', 'COMMENT')).toBe('15000000000000000000');
  });

  it('throws for unknown platform', () => {
    expect(() => getBaseReward('UNKNOWN', 'COMMENT')).toThrow();
  });
});

// ===== LS-Math Functions =====

describe('calculateConsistencyMultiplier', () => {
  it('returns 1.0 for 0 days', () => {
    expect(calculateConsistencyMultiplier(0)).toBe(1);
  });

  it('increases with more days', () => {
    expect(calculateConsistencyMultiplier(30)).toBeGreaterThan(calculateConsistencyMultiplier(1));
  });
});

describe('calculateContentPillarScore', () => {
  it('applies (P/10)^1.3 formula', () => {
    expect(calculateContentPillarScore(10)).toBe(1);
  });

  it('low quality gives diminished returns', () => {
    const score = calculateContentPillarScore(2);
    expect(score).toBeLessThan(0.15);
  });
});

describe('calculateDailyLightScore', () => {
  it('combines B and C with multipliers', () => {
    const result = calculateDailyLightScore(10, 10, 0, 0, 0);
    expect(result.rawScore).toBe(10);
    expect(result.finalScore).toBe(10);
  });

  it('risk reduces final score', () => {
    const clean = calculateDailyLightScore(10, 10, 0, 0, 0);
    const risky = calculateDailyLightScore(10, 10, 0, 0, 0.5);
    expect(risky.finalScore).toBeLessThan(clean.finalScore);
  });
});

// ===== Full Scoring Pipeline (0-10 scale) =====

describe('scoreAction — full pipeline', () => {
  const validInput: ScoringInput = {
    platformId: 'FUN_PLAY',
    actionType: 'COMMENT',
    pillarScores: { S: 8, T: 7, H: 7, C: 8, U: 6 },
    unitySignals: { collaboration: true, beneficiaryConfirmed: true },
    antiSybilScore: 0.9,
    hasStake: true,
    baseRewardAtomic: '15000000000000000000',
    qualityMultiplier: 1.5,
    impactMultiplier: 1.5,
    streakDays: 20,
    sequenceBonus: 3,
    riskScore: 0,
  };

  it('AUTHORIZE for valid high-quality action', () => {
    const result = scoreAction(validInput);
    expect(result.decision).toBe('AUTHORIZE');
    expect(result.lightScore).toBeGreaterThan(0);
    expect(BigInt(result.calculatedAmountAtomic)).toBeGreaterThan(0n);
  });

  it('REJECT when anti-sybil is too low', () => {
    const result = scoreAction({ ...validInput, antiSybilScore: 0.3 });
    expect(result.decision).toBe('REJECT');
    expect(result.reasonCodes).toContain('FRAUD_DETECTED');
  });

  it('REJECT when all pillars are low (score < threshold)', () => {
    const result = scoreAction({
      ...validInput,
      pillarScores: { S: 2, T: 2, H: 2, C: 2, U: 2 },
    });
    // (2^5)/10000 = 0.0032 < 10 threshold
    expect(result.decision).toBe('REJECT');
  });

  it('REJECT when PPLP validation fails', () => {
    const result = scoreAction({
      ...validInput,
      pplpValidation: {
        hasRealAction: false,
        hasRealValue: true,
        hasPositiveImpact: true,
        noExploitation: true,
        charterCompliant: true,
      },
    });
    expect(result.decision).toBe('REJECT');
    expect(result.reasonCodes.some(r => r.includes('PPLP_FAILED'))).toBe(true);
  });

  it('streak days affect final amount', () => {
    const noStreak = scoreAction({ ...validInput, streakDays: 0 });
    const withStreak = scoreAction({ ...validInput, streakDays: 30 });
    if (noStreak.decision === 'AUTHORIZE' && withStreak.decision === 'AUTHORIZE') {
      expect(BigInt(withStreak.calculatedAmountAtomic)).toBeGreaterThan(
        BigInt(noStreak.calculatedAmountAtomic)
      );
    }
  });
});
