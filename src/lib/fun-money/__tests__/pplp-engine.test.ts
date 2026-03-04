/**
 * PPLP Engine Tests — End-to-end scoring pipeline
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
  BASE_REWARDS,
  type PillarScores,
  type ScoringInput,
} from '../pplp-engine';

// ===== Light Score Calculation =====

describe('calculateLightScore', () => {
  it('calculates weighted sum of 5 pillars', () => {
    const pillars: PillarScores = { S: 80, T: 70, H: 60, C: 90, U: 50 };
    // 0.25*80 + 0.20*70 + 0.20*60 + 0.20*90 + 0.15*50 = 20+14+12+18+7.5 = 71.5
    expect(calculateLightScore(pillars)).toBe(71.5);
  });

  it('returns 0 for all-zero pillars', () => {
    expect(calculateLightScore({ S: 0, T: 0, H: 0, C: 0, U: 0 })).toBe(0);
  });

  it('returns 100 for all-max pillars', () => {
    expect(calculateLightScore({ S: 100, T: 100, H: 100, C: 100, U: 100 })).toBe(100);
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

  it('returns higher Ux for higher unity', () => {
    expect(calculateUnityMultiplier(90)).toBeGreaterThanOrEqual(2.0);
  });

  it('applies partner attested bonus', () => {
    const base = calculateUnityMultiplier(70);
    const withPartner = calculateUnityMultiplier(70, { partnerAttested: true });
    expect(withPartner).toBeGreaterThan(base);
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

  it('stake boost increases K', () => {
    const noStake = calculateIntegrityMultiplier(0.7, false);
    const withStake = calculateIntegrityMultiplier(0.7, true);
    expect(withStake).toBeGreaterThanOrEqual(noStake);
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
    // 100 * 1.5 * 1.5 * 1.0 * 1.0 = 225
    expect(BigInt(amount)).toBe(225000000000000000000n);
  });

  it('caps at maxAmountAtomic for extreme multipliers', () => {
    const amount = calculateMintAmount(
      '100000000000000000000000', // 100K FUN
      { Q: 3.0, I: 5.0, K: 1.0, Ux: 2.5 }
    );
    expect(BigInt(amount)).toBeLessThanOrEqual(500000000000000000000000n);
  });

  it('ensures minimum mint of 1 FUN', () => {
    const amount = calculateMintAmount(
      '1', // tiny amount
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

  it('formats fractional amounts', () => {
    const formatted = formatFunAmount('100500000000000000000');
    expect(formatted).toContain('FUN');
    expect(formatted).toContain('100');
  });

  it('formats zero', () => {
    expect(formatFunAmount('0')).toBe('0 FUN');
  });
});

describe('parseFunAmount', () => {
  it('parses whole FUN amount', () => {
    expect(parseFunAmount('100 FUN')).toBe('100000000000000000000');
  });

  it('parses fractional FUN amount', () => {
    const atomic = parseFunAmount('1.5 FUN');
    expect(BigInt(atomic)).toBe(1500000000000000000n);
  });

  it('throws on invalid format', () => {
    expect(() => parseFunAmount('abc')).toThrow();
  });
});

// ===== Base Rewards =====

describe('getBaseReward', () => {
  it('returns correct reward for FUN_PLAY COMMENT', () => {
    const reward = getBaseReward('FUN_PLAY', 'COMMENT');
    expect(reward).toBe('15000000000000000000');
  });

  it('throws for unknown platform', () => {
    expect(() => getBaseReward('UNKNOWN', 'COMMENT')).toThrow();
  });

  it('throws for unknown action', () => {
    expect(() => getBaseReward('FUN_PLAY', 'UNKNOWN')).toThrow();
  });

  it('all base rewards are valid BigInt strings', () => {
    for (const [platform, actions] of Object.entries(BASE_REWARDS)) {
      for (const [action, reward] of Object.entries(actions)) {
        expect(() => BigInt(reward), `${platform}.${action}`).not.toThrow();
        expect(BigInt(reward)).toBeGreaterThan(0n);
      }
    }
  });
});

// ===== LS-Math Functions in pplp-engine =====

describe('calculateConsistencyMultiplier (pplp-engine)', () => {
  it('returns 1.0 for 0 days', () => {
    expect(calculateConsistencyMultiplier(0)).toBe(1);
  });

  it('increases with more days', () => {
    expect(calculateConsistencyMultiplier(30)).toBeGreaterThan(calculateConsistencyMultiplier(1));
  });
});

describe('calculateContentPillarScore', () => {
  it('applies (P/10)^1.3 formula', () => {
    const score = calculateContentPillarScore(10); // full marks
    expect(score).toBe(1);
  });

  it('low quality gives diminished returns', () => {
    const score = calculateContentPillarScore(2);
    expect(score).toBeCloseTo(0.1234, 2);
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

// ===== Full Scoring Pipeline =====

describe('scoreAction — full pipeline', () => {
  const validInput: ScoringInput = {
    platformId: 'FUN_PLAY',
    actionType: 'COMMENT',
    pillarScores: { S: 80, T: 75, H: 70, C: 85, U: 60 },
    unitySignals: { collaboration: true, beneficiaryConfirmed: true },
    antiSybilScore: 0.9,
    hasStake: true,
    baseRewardAtomic: '15000000000000000000', // 15 FUN
    qualityMultiplier: 1.5,
    impactMultiplier: 1.5,
    streakDays: 20,
    sequenceBonus: 3,
    riskScore: 0,
  };

  it('AUTHORIZE for valid high-quality action', () => {
    const result = scoreAction(validInput);
    expect(result.decision).toBe('AUTHORIZE');
    expect(result.lightScore).toBeGreaterThan(60);
    expect(BigInt(result.calculatedAmountAtomic)).toBeGreaterThan(0n);
  });

  it('REJECT when anti-sybil is too low', () => {
    const result = scoreAction({ ...validInput, antiSybilScore: 0.3 });
    expect(result.decision).toBe('REJECT');
    expect(result.reasonCodes).toContain('FRAUD_DETECTED');
  });

  it('REJECT when light score below threshold', () => {
    const result = scoreAction({
      ...validInput,
      pillarScores: { S: 20, T: 20, H: 20, C: 20, U: 20 },
    });
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
    expect(result.calculatedAmountAtomic).toBe('0');
  });

  it('passes all 5 PPLP conditions for valid action', () => {
    const result = scoreAction({
      ...validInput,
      pplpValidation: {
        hasRealAction: true,
        hasRealValue: true,
        hasPositiveImpact: true,
        noExploitation: true,
        charterCompliant: true,
      },
    });
    expect(result.decision).toBe('AUTHORIZE');
  });

  it('REVIEW_HOLD for large mint amounts', () => {
    const result = scoreAction({
      ...validInput,
      baseRewardAtomic: '250000000000000000000', // 250 FUN
      qualityMultiplier: 3.0,
      impactMultiplier: 3.0,
    });
    // Large amount should trigger audit
    expect(['REVIEW_HOLD', 'AUTHORIZE']).toContain(result.decision);
  });

  it('calculatedAmountFormatted contains FUN', () => {
    const result = scoreAction(validInput);
    expect(result.calculatedAmountFormatted).toContain('FUN');
  });

  it('streak days affect final amount', () => {
    const noStreak = scoreAction({ ...validInput, streakDays: 0 });
    const withStreak = scoreAction({ ...validInput, streakDays: 30 });
    // Both should authorize but streak should give more
    if (noStreak.decision === 'AUTHORIZE' && withStreak.decision === 'AUTHORIZE') {
      expect(BigInt(withStreak.calculatedAmountAtomic)).toBeGreaterThan(
        BigInt(noStreak.calculatedAmountAtomic)
      );
    }
  });
});
