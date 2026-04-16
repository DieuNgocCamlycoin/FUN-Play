import { describe, it, expect } from 'vitest';
import {
  EVENT_BASE_VALUES,
  resolveBaseValue,
  getQualityMultiplier,
  getTrustConfidence,
  classifyIIS,
  classifyImpact,
  classifyAAF,
  calculateEgoRiskPenalty,
  classifyEgoRisk,
  getConsistencyMultiplier,
  CONSISTENCY_TABLE,
  RELIABILITY_TABLE,
  TLS_PHASE_WEIGHTS,
  ACTIVATION_THRESHOLDS,
  checkActivation,
  rawToDisplay,
  displayToRaw,
  calculateLongevity,
  TRUST_LEVELS,
  QUALITY_LEVELS,
  IIS_PATTERNS,
  IMPACT_LEVELS,
  AAF_LEVELS,
  EGO_RISK_PATTERNS,
} from '../light-score-params-v1';

// ===== I. BASE VALUES =====

describe('Event Base Values', () => {
  it('should have 15 event types', () => {
    expect(Object.keys(EVENT_BASE_VALUES)).toHaveLength(15);
  });

  it('all base values within their min/max range', () => {
    for (const [key, cfg] of Object.entries(EVENT_BASE_VALUES)) {
      expect(cfg.default).toBeGreaterThanOrEqual(cfg.min);
      expect(cfg.default).toBeLessThanOrEqual(cfg.max);
    }
  });

  it('daily_checkin is low value (0.1-0.3)', () => {
    const dc = EVENT_BASE_VALUES.daily_checkin;
    expect(dc.min).toBe(0.1);
    expect(dc.max).toBe(0.3);
  });

  it('soulbound_mint is high value (8-15)', () => {
    const sb = EVENT_BASE_VALUES.soulbound_mint;
    expect(sb.min).toBe(8);
    expect(sb.max).toBe(15);
  });

  it('resolveBaseValue maps legacy codes', () => {
    expect(resolveBaseValue('post_created')).toBe(resolveBaseValue('content_created'));
    expect(resolveBaseValue('kyc_verified')).toBe(resolveBaseValue('did_verification'));
    expect(resolveBaseValue('unknown_action')).toBe(1.0);
  });
});

// ===== II. QUALITY =====

describe('Quality Multiplier (Q_e)', () => {
  it('low quality → 0.3-0.6 range', () => {
    const q = getQualityMultiplier(0.1);
    expect(q).toBeGreaterThanOrEqual(0.3);
    expect(q).toBeLessThanOrEqual(0.6);
  });

  it('normal quality → 0.8-1.0', () => {
    const q = getQualityMultiplier(0.45);
    expect(q).toBeGreaterThanOrEqual(0.8);
    expect(q).toBeLessThanOrEqual(1.0);
  });

  it('excellent quality → 1.3-1.8', () => {
    const q = getQualityMultiplier(0.95);
    expect(q).toBeGreaterThanOrEqual(1.3);
    expect(q).toBeLessThanOrEqual(1.8);
  });

  it('monotonically increasing', () => {
    const values = [0, 0.1, 0.3, 0.5, 0.7, 0.85, 1.0].map(getQualityMultiplier);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });
});

// ===== III. TRUST =====

describe('Trust Confidence (TC_e)', () => {
  it('5 trust levels defined', () => {
    expect(TRUST_LEVELS).toHaveLength(5);
  });

  it('unknown → 0.5-0.8 midpoint', () => {
    const tc = getTrustConfidence('unknown');
    expect(tc).toBeGreaterThanOrEqual(0.5);
    expect(tc).toBeLessThanOrEqual(0.8);
  });

  it('core → 1.4-1.5 midpoint', () => {
    const tc = getTrustConfidence('core');
    expect(tc).toBeGreaterThanOrEqual(1.4);
    expect(tc).toBeLessThanOrEqual(1.5);
  });

  it('legacy tier mapping works', () => {
    expect(getTrustConfidence('new')).toBe(getTrustConfidence('unknown'));
    expect(getTrustConfidence('veteran')).toBe(getTrustConfidence('strong'));
  });
});

// ===== IV. IIS =====

describe('IIS Patterns', () => {
  it('5 patterns defined', () => {
    expect(IIS_PATTERNS).toHaveLength(5);
  });

  it('classifies correctly', () => {
    expect(classifyIIS(0.1).id).toBe('spam');
    expect(classifyIIS(0.6).id).toBe('farming');
    expect(classifyIIS(0.95).id).toBe('normal');
    expect(classifyIIS(1.1).id).toBe('good');
    expect(classifyIIS(1.4).id).toBe('pure');
  });
});

// ===== V. IMPACT =====

describe('Impact Levels', () => {
  it('5 levels defined', () => {
    expect(IMPACT_LEVELS).toHaveLength(5);
  });

  it('classifies correctly', () => {
    expect(classifyImpact(0.6).id).toBe('none');
    expect(classifyImpact(0.9).id).toBe('light');
    expect(classifyImpact(1.2).id).toBe('clear');
    expect(classifyImpact(2.0).id).toBe('strong');
    expect(classifyImpact(2.8).id).toBe('massive');
  });
});

// ===== VI. AAF =====

describe('AAF Levels', () => {
  it('5 levels defined', () => {
    expect(AAF_LEVELS).toHaveLength(5);
  });

  it('classifies correctly', () => {
    expect(classifyAAF(1.0).id).toBe('normal');
    expect(classifyAAF(0.6).id).toBe('suspicious');
    expect(classifyAAF(0.3).id).toBe('flagged');
    expect(classifyAAF(0.1).id).toBe('near_spam');
    expect(classifyAAF(0).id).toBe('blocked');
  });
});

// ===== VII. EGO RISK =====

describe('Ego Risk Penalty (ERP)', () => {
  it('neutral signals → 1.0', () => {
    expect(calculateEgoRiskPenalty({
      reward_claim_ratio: 0, shallow_content_ratio: 0,
      community_downvotes: 0, self_promotion_ratio: 0,
    })).toBe(1.0);
  });

  it('toxic signals → ≥ 0.5', () => {
    const erp = calculateEgoRiskPenalty({
      reward_claim_ratio: 1.0, shallow_content_ratio: 1.0,
      community_downvotes: 10, self_promotion_ratio: 1.0,
    });
    expect(erp).toBe(0.5);
  });

  it('bounded between 0.5 and 1.0', () => {
    for (let i = 0; i <= 10; i++) {
      const r = i / 10;
      const erp = calculateEgoRiskPenalty({
        reward_claim_ratio: r, shallow_content_ratio: r,
        community_downvotes: i, self_promotion_ratio: r,
      });
      expect(erp).toBeGreaterThanOrEqual(0.5);
      expect(erp).toBeLessThanOrEqual(1.0);
    }
  });
});

// ===== VIII. CONSISTENCY =====

describe('Consistency Table', () => {
  it('5 bands defined', () => {
    expect(CONSISTENCY_TABLE).toHaveLength(5);
  });

  it('streak 2 → 0.95', () => {
    expect(getConsistencyMultiplier(2)).toBe(0.95);
  });

  it('streak 5 → 1.0', () => {
    expect(getConsistencyMultiplier(5)).toBe(1.0);
  });

  it('streak 15 → 1.05', () => {
    expect(getConsistencyMultiplier(15)).toBe(1.05);
  });

  it('streak 60 → 1.1', () => {
    expect(getConsistencyMultiplier(60)).toBe(1.1);
  });

  it('streak 100 → 1.2', () => {
    expect(getConsistencyMultiplier(100)).toBe(1.2);
  });
});

// ===== IX. PHASE WEIGHTS =====

describe('Phase Weights', () => {
  it('all phases sum to 1.0', () => {
    for (const [phase, w] of Object.entries(TLS_PHASE_WEIGHTS)) {
      const sum = w.alpha + w.beta + w.gamma;
      expect(sum).toBeCloseTo(1.0, 10);
    }
  });

  it('early phase favors PLS (α=0.7)', () => {
    expect(TLS_PHASE_WEIGHTS.early.alpha).toBe(0.7);
  });

  it('mature phase is balanced', () => {
    expect(TLS_PHASE_WEIGHTS.mature.alpha).toBe(0.4);
    expect(TLS_PHASE_WEIGHTS.mature.beta).toBe(0.3);
    expect(TLS_PHASE_WEIGHTS.mature.gamma).toBe(0.3);
  });
});

// ===== X. ACTIVATION =====

describe('Activation Thresholds', () => {
  it('6 thresholds defined', () => {
    expect(ACTIVATION_THRESHOLDS).toHaveLength(6);
  });

  it('earn_basic requires LS>10 + TC>0.8', () => {
    expect(checkActivation('earn_basic', 15, 0.9)).toBe(true);
    expect(checkActivation('earn_basic', 5, 0.9)).toBe(false);
    expect(checkActivation('earn_basic', 15, 0.5)).toBe(false);
  });

  it('governance_vote requires LS>200', () => {
    expect(checkActivation('governance_vote', 250)).toBe(true);
    expect(checkActivation('governance_vote', 100)).toBe(false);
  });

  it('validator requires LS>1000', () => {
    expect(checkActivation('validator_curator', 1500)).toBe(true);
    expect(checkActivation('validator_curator', 500)).toBe(false);
  });
});

// ===== XI. DISPLAY NORMALIZATION =====

describe('Display Normalization', () => {
  it('rawToDisplay is monotonically increasing', () => {
    const raws = [0, 10, 100, 1000, 10000];
    const displays = raws.map(rawToDisplay);
    for (let i = 1; i < displays.length; i++) {
      expect(displays[i]).toBeGreaterThan(displays[i - 1]);
    }
  });

  it('rawToDisplay(0) = 0', () => {
    expect(rawToDisplay(0)).toBe(0);
  });

  it('displayToRaw inverts rawToDisplay', () => {
    for (const raw of [1, 10, 100, 1000]) {
      const display = rawToDisplay(raw);
      const back = displayToRaw(display);
      expect(back).toBeCloseTo(raw, 1);
    }
  });

  it('matches spec: rawToDisplay(10) ≈ 240', () => {
    // 100 * log(1+10) ≈ 239.79
    expect(rawToDisplay(10)).toBeCloseTo(239.79, 0);
  });
});

// ===== XII. LONGEVITY =====

describe('Longevity', () => {
  it('7 days → ~1.0', () => {
    expect(calculateLongevity(7)).toBeCloseTo(1.0, 1);
  });

  it('365 days → ~3.0', () => {
    const lo = calculateLongevity(365);
    expect(lo).toBeGreaterThan(2.5);
    expect(lo).toBeLessThan(3.5);
  });

  it('monotonically increasing', () => {
    const days = [1, 7, 30, 90, 365];
    const values = days.map(calculateLongevity);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
