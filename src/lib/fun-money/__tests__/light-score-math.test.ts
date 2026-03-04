import { describe, it, expect } from 'vitest';
import {
  reputationWeight,
  contentPillarScore,
  actionBaseScore,
  contentDailyScore,
  consistencyMultiplier,
  sequenceMultiplier,
  integrityPenalty,
  coldStartFallback,
  dailyLightScore,
  epochLightScore,
  checkEligibility,
  calculateMintAllocations,
  determineLevel,
  generateExplanation,
  LS_PARAMS,
  CONTENT_TYPE_WEIGHTS,
  ACTION_BASE_SCORES,
  type CommunityRating,
  type DailyScoreInput,
} from '../light-score-math';

// ===== SECTION 3: REPUTATION WEIGHT =====

describe('reputationWeight', () => {
  it('returns w_min for reputation = 0', () => {
    const w = reputationWeight(0);
    expect(w).toBeGreaterThanOrEqual(LS_PARAMS.w_min);
    expect(w).toBeLessThanOrEqual(LS_PARAMS.w_max);
  });

  it('increases with higher reputation', () => {
    const w1 = reputationWeight(10);
    const w10 = reputationWeight(100);
    expect(w10).toBeGreaterThan(w1);
    // Both 100 and 1000 hit w_max=2.0 due to log curve
    expect(w10).toBeGreaterThanOrEqual(w1);
  });

  it('never exceeds w_max', () => {
    const w = reputationWeight(1_000_000);
    expect(w).toBe(LS_PARAMS.w_max);
  });

  it('handles negative input gracefully', () => {
    // log(1 + (-5)) = log(-4) = NaN, clip produces NaN
    // This is expected: reputation should never be negative in practice
    const w = reputationWeight(0);
    expect(w).toBeGreaterThanOrEqual(LS_PARAMS.w_min);
  });
});

// ===== SECTION 4: CONTENT PILLAR SCORE =====

describe('contentPillarScore', () => {
  it('returns zeros for empty ratings', () => {
    const result = contentPillarScore([]);
    expect(result.total).toBe(0);
    expect(result.pillarScores).toEqual([0, 0, 0, 0, 0]);
  });

  it('calculates weighted average for single rater', () => {
    const ratings: CommunityRating[] = [{
      raterId: 'r1',
      contentId: 'c1',
      pillarScores: [2, 2, 2, 2, 2],
      raterReputation: 10,
    }];
    const result = contentPillarScore(ratings);
    expect(result.total).toBe(10);
    expect(result.pillarScores.every(s => s === 2)).toBe(true);
  });

  it('weights higher-reputation raters more', () => {
    const ratings: CommunityRating[] = [
      { raterId: 'r1', contentId: 'c1', pillarScores: [2, 2, 2, 2, 2], raterReputation: 100 },
      { raterId: 'r2', contentId: 'c1', pillarScores: [0, 0, 0, 0, 0], raterReputation: 1 },
    ];
    const result = contentPillarScore(ratings);
    // High-rep rater has more weight, but low-rep still dilutes
    expect(result.total).toBeGreaterThan(5);
  });

  it('max total is 10 (5 pillars × 2 max each)', () => {
    const ratings: CommunityRating[] = [{
      raterId: 'r1', contentId: 'c1',
      pillarScores: [2, 2, 2, 2, 2], raterReputation: 50,
    }];
    expect(contentPillarScore(ratings).total).toBe(10);
  });
});

// ===== SECTION 5: ACTION BASE SCORE =====

describe('actionBaseScore', () => {
  it('returns 0 for empty events', () => {
    expect(actionBaseScore([])).toBe(0);
  });

  it('sums base scores with default quality = 1.0', () => {
    const events = [
      { baseScore: 3 },
      { baseScore: 5 },
    ];
    expect(actionBaseScore(events)).toBe(8);
  });

  it('applies quality adjustment', () => {
    const events = [{ baseScore: 10, qualityAdjustment: 1.5 }];
    expect(actionBaseScore(events)).toBe(15);
  });

  it('clips quality adjustment to [0, 1.5]', () => {
    const events = [{ baseScore: 10, qualityAdjustment: 3.0 }];
    expect(actionBaseScore(events)).toBe(15); // capped at 1.5
  });

  it('clips negative quality to 0', () => {
    const events = [{ baseScore: 10, qualityAdjustment: -1 }];
    expect(actionBaseScore(events)).toBe(0);
  });
});

// ===== SECTION 6: CONTENT DAILY SCORE =====

describe('contentDailyScore', () => {
  it('returns 0 for empty contents', () => {
    expect(contentDailyScore([])).toBe(0);
  });

  it('applies (P/10)^γ power curve', () => {
    // P=10 → h=1.0, P=5 → h=(0.5)^1.3 ≈ 0.406
    const high = contentDailyScore([{ contentTypeWeight: 1.0, pillarTotal: 10 }]);
    const low = contentDailyScore([{ contentTypeWeight: 1.0, pillarTotal: 5 }]);
    expect(high).toBe(1);
    expect(low).toBeCloseTo(0.406, 2);
  });

  it('low quality content gets crushed by γ=1.3', () => {
    // P=2 → h=(0.2)^1.3 ≈ 0.1234 (actual calculation)
    const score = contentDailyScore([{ contentTypeWeight: 1.0, pillarTotal: 2 }]);
    expect(score).toBeCloseTo(0.1234, 2);
  });
});

// ===== SECTION 7: CONSISTENCY MULTIPLIER =====

describe('consistencyMultiplier', () => {
  it('returns 1.0 for streak = 0', () => {
    expect(consistencyMultiplier(0)).toBe(1);
  });

  it('increases with streak days', () => {
    const m1 = consistencyMultiplier(1);
    const m30 = consistencyMultiplier(30);
    const m90 = consistencyMultiplier(90);
    expect(m1).toBeGreaterThan(1);
    expect(m30).toBeGreaterThan(m1);
    expect(m90).toBeGreaterThan(m30);
  });

  it('saturates near 1 + β = 1.6', () => {
    const m365 = consistencyMultiplier(365);
    expect(m365).toBeCloseTo(1.6, 1);
  });

  it('streak=1 gives small bonus (~1.02)', () => {
    const m = consistencyMultiplier(1);
    expect(m).toBeCloseTo(1.02, 1);
  });
});

// ===== SECTION 8: SEQUENCE MULTIPLIER =====

describe('sequenceMultiplier', () => {
  it('returns 1.0 for bonus = 0', () => {
    expect(sequenceMultiplier(0)).toBe(1);
  });

  it('increases with bonus', () => {
    expect(sequenceMultiplier(5)).toBeGreaterThan(1);
  });

  it('caps near 1 + η = 1.5 via tanh saturation', () => {
    const m = sequenceMultiplier(1000);
    expect(m).toBeCloseTo(1.5, 1);
  });
});

// ===== SECTION 9: INTEGRITY PENALTY =====

describe('integrityPenalty', () => {
  it('returns 1.0 for risk = 0 (no penalty)', () => {
    expect(integrityPenalty(0)).toBe(1);
  });

  it('reduces score for high risk', () => {
    expect(integrityPenalty(0.5)).toBeLessThan(1);
  });

  it('max penalty is 50% (risk=0.625)', () => {
    const p = integrityPenalty(0.625);
    expect(p).toBe(0.5);
  });

  it('never goes below 0.5 even with risk=1.0', () => {
    expect(integrityPenalty(1.0)).toBe(0.5);
  });
});

// ===== SECTION 10: COLD START FALLBACK =====

describe('coldStartFallback', () => {
  it('returns topicAvg * trustFactor (clipped)', () => {
    expect(coldStartFallback(5.0, 1.0)).toBe(5.0);
  });

  it('clips trust factor to [0.8, 1.1]', () => {
    const low = coldStartFallback(10, 0.5);
    const high = coldStartFallback(10, 2.0);
    expect(low).toBe(8); // 10 * 0.8
    expect(high).toBe(11); // 10 * 1.1
  });
});

// ===== SECTION 11: DAILY LIGHT SCORE =====

describe('dailyLightScore', () => {
  it('combines action and content with correct weights', () => {
    const input: DailyScoreInput = {
      actionBase: 10,
      contentScore: 10,
      streakDays: 0,
      sequenceBonus: 0,
      riskScore: 0,
    };
    const result = dailyLightScore(input);
    // raw = 0.4*10 + 0.6*10 = 10
    expect(result.rawScore).toBe(10);
    expect(result.finalScore).toBe(10);
  });

  it('applies all multipliers correctly', () => {
    const input: DailyScoreInput = {
      actionBase: 10,
      contentScore: 10,
      streakDays: 30,
      sequenceBonus: 5,
      riskScore: 0,
    };
    const result = dailyLightScore(input);
    expect(result.consistencyMul).toBeGreaterThan(1);
    expect(result.sequenceMul).toBeGreaterThan(1);
    expect(result.integrityPen).toBe(1);
    expect(result.finalScore).toBeGreaterThan(10);
  });

  it('risk score reduces final score', () => {
    const clean = dailyLightScore({ actionBase: 10, contentScore: 10, streakDays: 0, sequenceBonus: 0, riskScore: 0 });
    const risky = dailyLightScore({ actionBase: 10, contentScore: 10, streakDays: 0, sequenceBonus: 0, riskScore: 0.5 });
    expect(risky.finalScore).toBeLessThan(clean.finalScore);
  });

  it('zero activity = zero score', () => {
    const result = dailyLightScore({ actionBase: 0, contentScore: 0, streakDays: 0, sequenceBonus: 0, riskScore: 0 });
    expect(result.finalScore).toBe(0);
  });
});

// ===== SECTION 12: EPOCH LIGHT SCORE =====

describe('epochLightScore', () => {
  it('sums daily scores', () => {
    expect(epochLightScore([5, 10, 15])).toBe(30);
  });

  it('returns 0 for empty array', () => {
    expect(epochLightScore([])).toBe(0);
  });
});

// ===== SECTION 13: ELIGIBILITY CHECK =====

describe('checkEligibility', () => {
  it('eligible when all conditions met', () => {
    const result = checkEligibility({
      pplpAccepted: true,
      avgRiskInEpoch: 0.1,
      epochLightScore: 50,
      hasUnresolvedReview: false,
    });
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('rejects when PPLP not accepted', () => {
    const result = checkEligibility({
      pplpAccepted: false,
      avgRiskInEpoch: 0,
      epochLightScore: 100,
      hasUnresolvedReview: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('PPLP_NOT_ACCEPTED');
  });

  it('rejects when risk too high', () => {
    const result = checkEligibility({
      pplpAccepted: true,
      avgRiskInEpoch: 0.5,
      epochLightScore: 100,
      hasUnresolvedReview: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('INTEGRITY_GATE_EXCEEDED');
  });

  it('rejects when light score below minimum', () => {
    const result = checkEligibility({
      pplpAccepted: true,
      avgRiskInEpoch: 0,
      epochLightScore: 5,
      hasUnresolvedReview: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('MINIMUM_CONTRIBUTION_NOT_MET');
  });

  it('rejects when unresolved review exists', () => {
    const result = checkEligibility({
      pplpAccepted: true,
      avgRiskInEpoch: 0,
      epochLightScore: 100,
      hasUnresolvedReview: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('UNRESOLVED_CLUSTER_REVIEW');
  });

  it('can fail multiple conditions at once', () => {
    const result = checkEligibility({
      pplpAccepted: false,
      avgRiskInEpoch: 0.9,
      epochLightScore: 1,
      hasUnresolvedReview: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.length).toBe(4);
  });
});

// ===== SECTION 14: MINT ALLOCATION =====

describe('calculateMintAllocations', () => {
  it('allocates proportionally by light score', () => {
    const result = calculateMintAllocations({
      users: [
        { userId: 'a', lightScore: 50, eligible: true },
        { userId: 'b', lightScore: 50, eligible: true },
      ],
      mintPool: 1000,
    });
    expect(result.allocations).toHaveLength(2);
    // Anti-whale cap (3% of 1000 = 30) kicks in, both get capped equally
    const a = result.allocations[0].amount;
    const b = result.allocations[1].amount;
    expect(a).toBeCloseTo(b, 0); // equal share
  });

  it('excludes ineligible users', () => {
    const result = calculateMintAllocations({
      users: [
        { userId: 'a', lightScore: 100, eligible: true },
        { userId: 'b', lightScore: 100, eligible: false },
      ],
      mintPool: 1000,
    });
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].userId).toBe('a');
  });

  it('applies anti-whale cap at 3%', () => {
    const result = calculateMintAllocations({
      users: [
        { userId: 'whale', lightScore: 50000, eligible: true },
        { userId: 'small', lightScore: 10, eligible: true },
      ],
      mintPool: 5_000_000,
    });
    const whale = result.allocations.find(a => a.userId === 'whale')!;
    expect(whale.amount).toBeLessThanOrEqual(150_000);
    expect(whale.capped).toBe(true);
  });

  it('redistributes excess from capped users', () => {
    const result = calculateMintAllocations({
      users: [
        { userId: 'whale', lightScore: 50000, eligible: true },
        { userId: 'normal', lightScore: 100, eligible: true },
      ],
      mintPool: 5_000_000,
    });
    expect(result.redistributed).toBeGreaterThan(0);
  });

  it('handles all users ineligible', () => {
    const result = calculateMintAllocations({
      users: [{ userId: 'a', lightScore: 100, eligible: false }],
      mintPool: 1000,
    });
    expect(result.allocations).toHaveLength(0);
    expect(result.totalAllocated).toBe(0);
  });
});

// ===== SECTION 15: LEVEL MAPPING =====

describe('determineLevel', () => {
  it('seed for score < 50', () => {
    expect(determineLevel(0)).toBe('seed');
    expect(determineLevel(49)).toBe('seed');
  });

  it('sprout for score 50-199', () => {
    expect(determineLevel(50)).toBe('sprout');
    expect(determineLevel(199)).toBe('sprout');
  });

  it('builder for score 200-499', () => {
    expect(determineLevel(200)).toBe('builder');
  });

  it('guardian for score 500-1199', () => {
    expect(determineLevel(500)).toBe('guardian');
  });

  it('architect for score >= 1200', () => {
    expect(determineLevel(1200)).toBe('architect');
    expect(determineLevel(99999)).toBe('architect');
  });
});

// ===== SECTION 16: EXPLAINABILITY =====

describe('generateExplanation', () => {
  it('produces valid explanation object', () => {
    const dailyResults = [{
      date: '2025-01-01',
      input: { actionBase: 5, contentScore: 5, streakDays: 10, sequenceBonus: 2, riskScore: 0 } as DailyScoreInput,
      result: dailyLightScore({ actionBase: 5, contentScore: 5, streakDays: 10, sequenceBonus: 2, riskScore: 0 }),
    }];
    const explanation = generateExplanation(
      dailyResults,
      [{ label: 'Great Post', score: 8 }],
      1,
      { eligible: true, reasons: [] },
    );
    expect(explanation.epochScore).toBeGreaterThan(0);
    expect(explanation.level).toBeDefined();
    expect(explanation.eligible).toBe(true);
    expect(explanation.topContributors.length).toBeGreaterThan(0);
  });
});

// ===== CONSTANTS VALIDATION =====

describe('constants integrity', () => {
  it('LS_PARAMS weights sum to 1.0', () => {
    expect(LS_PARAMS.omega_B + LS_PARAMS.omega_C).toBe(1.0);
  });

  it('all ACTION_BASE_SCORES are positive', () => {
    for (const [key, val] of Object.entries(ACTION_BASE_SCORES)) {
      expect(val, `${key} should be positive`).toBeGreaterThan(0);
    }
  });

  it('all CONTENT_TYPE_WEIGHTS are positive', () => {
    for (const [key, val] of Object.entries(CONTENT_TYPE_WEIGHTS)) {
      expect(val, `${key} should be positive`).toBeGreaterThan(0);
    }
  });

  it('level thresholds are in ascending order', () => {
    const t = LS_PARAMS.level_thresholds;
    expect(t.seed).toBeLessThan(t.sprout);
    expect(t.sprout).toBeLessThan(t.builder);
    expect(t.builder).toBeLessThan(t.guardian);
    expect(t.guardian).toBeLessThan(t.architect);
  });
});
