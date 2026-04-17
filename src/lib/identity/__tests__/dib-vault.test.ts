import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing module under test
vi.mock('@/integrations/supabase/client', () => {
  const builders: Record<string, any> = {};
  const make = (result: any) => {
    const b: any = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      maybeSingle: vi.fn(async () => result),
      then: undefined as any,
    };
    // when caller awaits the chain (no maybeSingle), resolve to result
    Object.defineProperty(b, 'then', {
      get() { return (resolve: any) => resolve(result); },
    });
    return b;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => builders[table] ?? make({ data: null, count: 0 })),
      __setTable: (table: string, result: any) => { builders[table] = make(result); },
    },
  };
});

import { computeDIB } from '../dib-vault';
import { supabase } from '@/integrations/supabase/client';

const setTable = (table: string, result: any) => (supabase as any).__setTable(table, result);

describe('computeDIB', () => {
  beforeEach(() => {
    setTable('did_registry', { data: { level: 'L0', status: 'pending', verified_org_badge: false, created_at: new Date().toISOString() } });
    setTable('trust_profile', { data: { vs: 0, bs: 0, ss: 0, os: 0, hs: 0, rf: 1, sybil_risk: 0 } });
    setTable('sbt_registry', { data: [], count: 0 });
    setTable('attestation_log', { data: [], count: 0 });
    setTable('profiles', { data: { created_at: new Date().toISOString(), consistency_days: 0, total_camly_rewards: 0 } });
    setTable('identity_events', { data: [], count: 0 });
    setTable('org_members', { data: [], count: 0 });
  });

  it('returns 7 vaults with normalized scores', async () => {
    const r = await computeDIB('u1');
    expect(r.vaults).toHaveLength(7);
    for (const v of r.vaults) {
      expect(v.score).toBeGreaterThanOrEqual(0);
      expect(v.score).toBeLessThanOrEqual(1);
    }
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(r.total).toBeLessThanOrEqual(1);
  });

  it('weights sum to 1.0', async () => {
    const r = await computeDIB('u1');
    const sum = r.vaults.reduce((a, v) => a + v.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('low signals → near-zero total', async () => {
    setTable('profiles', { data: { created_at: new Date().toISOString(), consistency_days: 0, total_camly_rewards: 0 } });
    const r = await computeDIB('u1');
    expect(r.total).toBeLessThan(0.15);
  });

  it('L4 + verified org → high identity vault', async () => {
    setTable('did_registry', { data: { level: 'L4', status: 'verified', verified_org_badge: true, created_at: new Date().toISOString() } });
    const r = await computeDIB('u1');
    const identity = r.vaults.find(v => v.key === 'identity')!;
    expect(identity.score).toBeGreaterThanOrEqual(0.95);
  });

  it('sybil risk penalizes reputation vault', async () => {
    setTable('trust_profile', { data: { vs: 0.8, bs: 0.8, ss: 0.8, os: 0.8, hs: 0.8, rf: 1, sybil_risk: 80 } });
    const r = await computeDIB('u1');
    const rep = r.vaults.find(v => v.key === 'reputation')!;
    // pillar_avg 0.8 * (1 - 80/200=0.4) = 0.48
    expect(rep.score).toBeCloseTo(0.48, 1);
  });
});
