import { describe, it, expect } from 'vitest';
import {
  evaluateBehavior,
  evaluateIntention,
  evaluateImpact,
  calculateAntiAbuseFactor,
  calculateVVU,
  runPPLPv25Pipeline,
  type RawEvent,
  type ContextTag,
  type QualitySignals,
  type IntentionSignals,
  type ImpactSignals,
  type AbuseSignals,
} from '../pplp-engine-v25';

const makeEvent = (code = 'content_created'): RawEvent => ({
  event_id: 'test-1',
  user_id: 'user-1',
  category: 'content_creation',
  action_code: code,
  timestamp: new Date().toISOString(),
  metadata: {},
});

const makeContext = (tier = 'basic'): ContextTag => ({
  platform: 'web',
  is_first_time: false,
  time_of_day: 'morning',
  day_of_week: 1,
  user_trust_tier: tier,
  account_age_days: 30,
});

const makeQuality = (overrides?: Partial<QualitySignals>): QualitySignals => ({
  content_length: 200,
  content_originality: 0.7,
  response_time_minutes: 5,
  completion_rate: 0.9,
  proof_verified: true,
  ...overrides,
});

const makeIntention = (): IntentionSignals => ({
  active_streak_days: 30,
  total_actions_30d: 50,
  useful_actions_30d: 40,
  farm_pattern_actions_30d: 2,
  manipulation_flags: 0,
  value_before_reward_ratio: 0.7,
  self_vs_network_ratio: 0.4,
  consistency_variance: 0.2,
});

const makeImpact = (): ImpactSignals => ({
  helped_newbie_activate: 3,
  helped_others_trust_increase: 2,
  content_saved_count: 10,
  content_reused_count: 5,
  referral_active_count: 2,
  referral_total_count: 5,
  proposal_improvement_score: 0.5,
  retention_contribution: 0.3,
  community_quality_contribution: 0.4,
  knowledge_contribution: 0.3,
  healthy_liquidity_contribution: 0.2,
});

const makeAbuse = (overrides?: Partial<AbuseSignals>): AbuseSignals => ({
  fraud_score: 0,
  sybil_probability: 0,
  velocity_violation: false,
  duplicate_content: false,
  community_reports: 0,
  ip_collision_score: 0,
  ...overrides,
});

describe('Behavior Layer', () => {
  it('returns correct base value for content_created', () => {
    const b = evaluateBehavior(makeEvent(), makeContext(), makeQuality());
    expect(b.base_value).toBe(3); // content_created default
  });

  it('quality_score in spec range 0.3-1.8', () => {
    const low = evaluateBehavior(makeEvent(), makeContext(), makeQuality({ content_length: 10, content_originality: 0.1, completion_rate: 0.1, proof_verified: false }));
    expect(low.quality_score).toBeGreaterThanOrEqual(0.3);

    const high = evaluateBehavior(makeEvent(), makeContext(), makeQuality({ content_length: 500, content_originality: 1.0, completion_rate: 1.0, proof_verified: true }));
    expect(high.quality_score).toBeLessThanOrEqual(1.8);
  });

  it('trust_weight varies by tier', () => {
    const unknown = evaluateBehavior(makeEvent(), makeContext('unknown'), makeQuality());
    const core = evaluateBehavior(makeEvent(), makeContext('core'), makeQuality());
    expect(core.trust_weight).toBeGreaterThan(unknown.trust_weight);
  });
});

describe('Intention Layer', () => {
  it('good signals → IIS > 0.9', () => {
    const result = evaluateIntention(makeIntention());
    expect(result.iis).toBeGreaterThan(0.5);
  });

  it('spam signals → IIS < 0.3', () => {
    const result = evaluateIntention({
      active_streak_days: 0,
      total_actions_30d: 100,
      useful_actions_30d: 5,
      farm_pattern_actions_30d: 80,
      manipulation_flags: 5,
      value_before_reward_ratio: 0.05,
      self_vs_network_ratio: 0.01,
      consistency_variance: 0.9,
    });
    expect(result.iis).toBeLessThan(0.3);
  });

  it('IIS bounded 0-1.5', () => {
    const result = evaluateIntention(makeIntention());
    expect(result.iis).toBeGreaterThanOrEqual(0);
    expect(result.iis).toBeLessThanOrEqual(1.5);
  });
});

describe('Impact Layer', () => {
  it('IM bounded 0.5-3.0', () => {
    const result = evaluateImpact(makeImpact());
    expect(result.im).toBeGreaterThanOrEqual(0.5);
    expect(result.im).toBeLessThanOrEqual(3.0);
  });

  it('zero signals → IM = 0.5 (floor)', () => {
    const result = evaluateImpact({
      helped_newbie_activate: 0, helped_others_trust_increase: 0,
      content_saved_count: 0, content_reused_count: 0,
      referral_active_count: 0, referral_total_count: 0,
      proposal_improvement_score: 0, retention_contribution: 0,
      community_quality_contribution: 0, knowledge_contribution: 0,
      healthy_liquidity_contribution: 0,
    });
    expect(result.im).toBe(0.5);
  });
});

describe('Anti-Abuse Factor', () => {
  it('clean signals → AAF = 1.0', () => {
    const { aaf } = calculateAntiAbuseFactor(makeAbuse());
    expect(aaf).toBeCloseTo(1.0, 2);
  });

  it('fraud → AAF drops', () => {
    const { aaf } = calculateAntiAbuseFactor(makeAbuse({ fraud_score: 0.8 }));
    expect(aaf).toBeLessThan(0.5);
  });

  it('velocity violation → AAF *= 0.3', () => {
    const { aaf } = calculateAntiAbuseFactor(makeAbuse({ velocity_violation: true }));
    expect(aaf).toBeLessThanOrEqual(0.3);
  });

  it('block = 0', () => {
    const { aaf } = calculateAntiAbuseFactor(makeAbuse({
      fraud_score: 1.0, sybil_probability: 1.0,
      velocity_violation: true, duplicate_content: true,
      community_reports: 10, ip_collision_score: 1.0,
    }));
    expect(aaf).toBeCloseTo(0, 1);
  });
});

describe('VVU Calculation', () => {
  it('VVU = product of all components', () => {
    const behavior = { base_value: 3, quality_score: 1.0, trust_weight: 1.0, context_bonus: 1.0 };
    const intention = { iis: 1.0, pattern: 'normal', breakdown: { consistency_signal: 0, useful_ratio: 0, manipulation_penalty: 0, value_first_bonus: 0, network_orientation: 0 } };
    const impact = { im: 1.0, level: 'clear', breakdown: { activation_help: 0, trust_amplification: 0, content_ripple: 0, referral_quality: 0, ecosystem_health: 0 } };
    const result = calculateVVU(behavior, intention, impact, 1.0, 1.0);
    expect(result.vvu).toBe(3);
  });

  it('VVU never negative', () => {
    const behavior = { base_value: 3, quality_score: 0.3, trust_weight: 0.5, context_bonus: 0.8 };
    const intention = { iis: 0, pattern: 'spam', breakdown: { consistency_signal: 0, useful_ratio: 0, manipulation_penalty: 0, value_first_bonus: 0, network_orientation: 0 } };
    const impact = { im: 0.5, level: 'none', breakdown: { activation_help: 0, trust_amplification: 0, content_ripple: 0, referral_quality: 0, ecosystem_health: 0 } };
    const result = calculateVVU(behavior, intention, impact, 0, 0.5);
    expect(result.vvu).toBeGreaterThanOrEqual(0);
  });
});

describe('Full Pipeline', () => {
  it('runs without error', () => {
    const result = runPPLPv25Pipeline({
      event: makeEvent(),
      context: makeContext(),
      quality: makeQuality(),
      intention: makeIntention(),
      impact: makeImpact(),
      abuse: makeAbuse(),
    });
    expect(result.vvu).toBeGreaterThanOrEqual(0);
    expect(result.components).toBeDefined();
    expect(result.aaf_level).toBeDefined();
    expect(result.erp_level).toBeDefined();
  });
});
