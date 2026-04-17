import { describe, it, expect } from 'vitest';
import { checkPermission, ACTIVATION_MATRIX } from '../permission-matrix';

const baseUser = {
  did_level: 'L4',
  tc: 1.5,
  has_sbt: true,
  sybil_risk: 0,
};

describe('permission-matrix', () => {
  it('exposes all canonical actions', () => {
    const actions = ACTIVATION_MATRIX.map((r) => r.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'basic_access',
        'earn_basic',
        'referral_reward',
        'mint_full',
        'governance_vote',
        'proposal_submit',
        'reviewer',
        'sbt_issuer',
      ])
    );
  });

  it('rejects unknown action', () => {
    const r = checkPermission('does_not_exist', baseUser);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/Unknown action/);
  });

  it('blocks any action when sybil_risk >= 60', () => {
    const r = checkPermission('basic_access', { ...baseUser, sybil_risk: 60 });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/Sybil/);
  });

  it('blocks governance_vote when DID too low', () => {
    const r = checkPermission('governance_vote', {
      ...baseUser,
      did_level: 'L1',
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/DID L2/);
  });

  it('blocks governance_vote when TC too low', () => {
    const r = checkPermission('governance_vote', { ...baseUser, tc: 0.95 });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/TC/);
  });

  it('blocks governance_vote when SBT missing', () => {
    const r = checkPermission('governance_vote', { ...baseUser, has_sbt: false });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/SBT/);
  });

  it('allows governance_vote when all met', () => {
    const r = checkPermission('governance_vote', {
      did_level: 'L2',
      tc: 1.0,
      has_sbt: true,
      sybil_risk: 0,
    });
    expect(r.allowed).toBe(true);
  });

  it('proposal_submit needs L3 + TC≥1.10 + SBT', () => {
    expect(
      checkPermission('proposal_submit', {
        did_level: 'L2',
        tc: 1.2,
        has_sbt: true,
        sybil_risk: 0,
      }).allowed
    ).toBe(false);
    expect(
      checkPermission('proposal_submit', {
        did_level: 'L3',
        tc: 1.1,
        has_sbt: true,
        sybil_risk: 0,
      }).allowed
    ).toBe(true);
  });

  it('sbt_issuer needs L4 + TC≥1.25', () => {
    expect(
      checkPermission('sbt_issuer', {
        did_level: 'L3',
        tc: 1.3,
        has_sbt: true,
        sybil_risk: 0,
      }).allowed
    ).toBe(false);
    expect(
      checkPermission('sbt_issuer', {
        did_level: 'L4',
        tc: 1.25,
        has_sbt: true,
        sybil_risk: 0,
      }).allowed
    ).toBe(true);
  });

  it('basic_access works for everyone above sybil threshold', () => {
    const r = checkPermission('basic_access', {
      did_level: 'L0',
      tc: 0.3,
      has_sbt: false,
      sybil_risk: 10,
    });
    expect(r.allowed).toBe(true);
  });
});
