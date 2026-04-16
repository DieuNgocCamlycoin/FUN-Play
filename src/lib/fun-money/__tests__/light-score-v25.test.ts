import { describe, it, expect } from 'vitest';
import {
  consistencyMultiplierV25,
  reliabilityMultiplierV25,
  calculatePLS,
  calculateNLS,
  calculateLLS,
  calculateTLS,
  getActivationStatus,
  getLightTierV25,
  getMintWeight,
  getGovernanceWeight,
  LIGHT_TIERS_V25,
} from '../light-score-v25';
import { rawToDisplay } from '../light-score-params-v1';

describe('Consistency Multiplier', () => {
  it('low streak → 0.95', () => {
    expect(consistencyMultiplierV25(2)).toBe(0.95);
  });

  it('medium streak → 1.05', () => {
    expect(consistencyMultiplierV25(15)).toBe(1.05);
  });

  it('high streak → 1.2', () => {
    expect(consistencyMultiplierV25(100)).toBe(1.2);
  });
});

describe('Reliability Multiplier', () => {
  it('bad reliability → 0.6-0.8', () => {
    const r = reliabilityMultiplierV25({
      completion_rate: 0.2, commitment_kept_rate: 0.1,
      flag_count: 3, reward_reversals: 2, valid_reports_against: 2,
    });
    expect(r).toBeGreaterThanOrEqual(0.6);
    expect(r).toBeLessThanOrEqual(0.8);
  });

  it('good reliability → 1.0-1.2', () => {
    const r = reliabilityMultiplierV25({
      completion_rate: 0.95, commitment_kept_rate: 0.9,
      flag_count: 0, reward_reversals: 0, valid_reports_against: 0,
    });
    expect(r).toBeGreaterThanOrEqual(1.0);
    expect(r).toBeLessThanOrEqual(1.2);
  });
});

describe('PLS Calculation', () => {
  it('accumulates correctly', () => {
    const result = calculatePLS({
      previous_pls: 10,
      vvu_personal_sum: 5,
      consistency: { active_streak_days: 15 },
      reliability: { completion_rate: 0.9, commitment_kept_rate: 0.9, flag_count: 0, reward_reversals: 0, valid_reports_against: 0 },
    });
    expect(result.pls).toBeGreaterThan(10);
    expect(result.delta).toBeGreaterThan(0);
    expect(result.c).toBe(1.05);
  });
});

describe('TLS Calculation', () => {
  it('early phase weights α=0.7', () => {
    const result = calculateTLS(100, 50, 20, 0, 0, 0, 'early');
    expect(result.phase).toBe('early');
    // TLS = 0.7*100 + 0.2*50 + 0.1*20 = 82
    expect(result.raw_tls).toBeCloseTo(82, 0);
  });

  it('display uses log normalization', () => {
    const result = calculateTLS(100, 50, 20);
    expect(result.display_tls).toBeCloseTo(rawToDisplay(result.raw_tls), 2);
  });

  it('assigns correct tier', () => {
    // Display 0 → Seed
    const low = calculateTLS(0, 0, 0);
    expect(low.tier.id).toBe('seed_light');

    // Very high → should be cosmic
    const high = calculateTLS(100000, 50000, 30000);
    expect(high.tier.id).toBe('cosmic_light');
  });
});

describe('Tier System', () => {
  it('6 tiers defined', () => {
    expect(LIGHT_TIERS_V25).toHaveLength(6);
  });

  it('tiers are ordered by minDisplayScore', () => {
    for (let i = 1; i < LIGHT_TIERS_V25.length; i++) {
      expect(LIGHT_TIERS_V25[i].minDisplayScore).toBeGreaterThan(LIGHT_TIERS_V25[i - 1].minDisplayScore);
    }
  });

  it('getLightTierV25 returns seed for 0', () => {
    expect(getLightTierV25(0).id).toBe('seed_light');
  });

  it('getLightTierV25 returns cosmic for 2000', () => {
    expect(getLightTierV25(2000).id).toBe('cosmic_light');
  });
});

describe('Activation Status', () => {
  it('low LS → most disabled', () => {
    const tls = calculateTLS(1, 0, 0);
    const status = getActivationStatus(tls, 'unknown', 0.5);
    expect(status.earning_enabled).toBe(false);
    expect(status.voting_enabled).toBe(false);
  });

  it('high LS + high TC → most enabled', () => {
    const tls = calculateTLS(100000, 50000, 30000);
    const status = getActivationStatus(tls, 'core', 1.45);
    expect(status.earning_enabled).toBe(true);
    expect(status.voting_enabled).toBe(true);
    expect(status.proposal_enabled).toBe(true);
    expect(status.validator_enabled).toBe(true);
  });
});

describe('Governance Weight', () => {
  it('low tier → 0', () => {
    expect(getGovernanceWeight(10)).toBe(0);
  });

  it('cosmic → 3.0', () => {
    expect(getGovernanceWeight(2000)).toBe(3.0);
  });
});
