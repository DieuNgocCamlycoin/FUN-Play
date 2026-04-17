import { describe, it, expect } from 'vitest';
import { computeTrust, type TrustSignals } from '../trust-engine-v1';

const minSignals: TrustSignals = {
  did_level: 'L0',
  email_verified: false,
  phone_verified: false,
  wallet_linked: false,
  kyc_passed: false,
  pplp_accepted: false,
  account_age_days: 0,
  consistency_streak: 0,
  total_valid_actions: 0,
  total_flagged_actions: 0,
  anti_farm_risk_avg: 0,
  attestations_received: 0,
  attestations_weight_sum: 0,
  community_endorsements: 0,
  community_flags: 0,
  mentor_sessions: 0,
  wallet_age_days: 0,
  on_chain_tx_count: 0,
  active_sbt_count: 0,
  governance_clean: true,
  reward_reversal_count: 0,
  ban_history_count: 0,
  ip_collisions: 0,
  is_blacklisted: false,
};

const fullSignals: TrustSignals = {
  did_level: 'L4',
  email_verified: true,
  phone_verified: true,
  wallet_linked: true,
  kyc_passed: true,
  pplp_accepted: true,
  account_age_days: 365,
  consistency_streak: 91,
  total_valid_actions: 500,
  total_flagged_actions: 0,
  anti_farm_risk_avg: 0,
  attestations_received: 25,
  attestations_weight_sum: 1.5,
  community_endorsements: 10,
  community_flags: 0,
  mentor_sessions: 10,
  wallet_age_days: 365,
  on_chain_tx_count: 100,
  active_sbt_count: 10,
  governance_clean: true,
  reward_reversal_count: 0,
  ban_history_count: 0,
  ip_collisions: 0,
  is_blacklisted: false,
};

describe('trust-engine-v1', () => {
  it('TC stays inside [0.30, 1.50]', () => {
    const min = computeTrust(minSignals);
    const max = computeTrust(fullSignals);
    expect(min.tc).toBeGreaterThanOrEqual(0.3);
    expect(min.tc).toBeLessThanOrEqual(1.5);
    expect(max.tc).toBeGreaterThanOrEqual(0.3);
    expect(max.tc).toBeLessThanOrEqual(1.5);
  });

  it('full positive signals → high tier (T3 or T4)', () => {
    const r = computeTrust(fullSignals);
    expect(['T3', 'T4']).toContain(r.tier);
    expect(r.tc).toBeGreaterThan(1.0);
  });

  it('minimal signals → T0', () => {
    const r = computeTrust(minSignals);
    expect(r.tier).toBe('T0');
  });

  it('blacklisted forces RF penalty + sybil/fraud=100', () => {
    const r = computeTrust({ ...fullSignals, is_blacklisted: true });
    expect(r.sybil_risk).toBe(100);
    expect(r.fraud_risk).toBe(100);
    expect(r.rf).toBe(0.3);
    expect(r.permission_flags.can_vote).toBe(false);
    expect(r.permission_flags.can_mint_full).toBe(false);
  });

  it('high IP collision raises sybil risk and lowers RF', () => {
    const r = computeTrust({ ...fullSignals, ip_collisions: 10 });
    expect(r.sybil_risk).toBeGreaterThanOrEqual(40);
    expect(r.rf).toBeLessThan(1.0);
  });

  it('permissions: can_vote requires DID≥L2 + TC≥1.0', () => {
    const low = computeTrust({ ...fullSignals, did_level: 'L1' });
    expect(low.permission_flags.can_vote).toBe(false);
    const ok = computeTrust(fullSignals);
    expect(ok.permission_flags.can_vote).toBe(true);
  });

  it('permissions: can_issue_sbt requires DID L4 + TC≥1.25', () => {
    const r = computeTrust(fullSignals);
    expect(r.permission_flags.can_issue_sbt).toBe(true);
    const r3 = computeTrust({ ...fullSignals, did_level: 'L3' });
    expect(r3.permission_flags.can_issue_sbt).toBe(false);
  });

  it('TC is deterministic for same input', () => {
    const a = computeTrust(fullSignals);
    const b = computeTrust(fullSignals);
    expect(a.tc).toEqual(b.tc);
    expect(a.tier).toEqual(b.tier);
  });

  it('5 sub-scores are clamped to [0, 1]', () => {
    const r = computeTrust(fullSignals);
    for (const v of [r.vs, r.bs, r.ss, r.os, r.hs]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
