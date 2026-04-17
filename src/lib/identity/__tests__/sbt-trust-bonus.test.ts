import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  let nextResult: any = { data: [], error: null };
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    then: (resolve: any) => resolve(nextResult),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
      __setResult: (r: any) => {
        nextResult = r;
      },
    },
  };
});

import { getSbtTrustBonus, applySbtBonus, SBT_BONUS_CAP } from '../sbt-trust-bonus';
import { supabase } from '@/integrations/supabase/client';

const setResult = (r: any) => (supabase as any).__setResult(r);

describe('sbt-trust-bonus', () => {
  beforeEach(() => setResult({ data: [], error: null }));

  it('returns 0 when userId empty', async () => {
    expect(await getSbtTrustBonus('')).toBe(0);
  });

  it('returns 0 when no active SBTs', async () => {
    setResult({ data: [], error: null });
    expect(await getSbtTrustBonus('u1')).toBe(0);
  });

  it('returns 0 on supabase error', async () => {
    setResult({ data: null, error: { message: 'boom' } });
    expect(await getSbtTrustBonus('u1')).toBe(0);
  });

  it('sums trust_weight of active SBTs', async () => {
    setResult({
      data: [{ trust_weight: 0.05 }, { trust_weight: 0.04 }],
      error: null,
    });
    const v = await getSbtTrustBonus('u1');
    expect(v).toBeCloseTo(0.09, 5);
  });

  it('caps total bonus at SBT_BONUS_CAP (0.15)', async () => {
    setResult({
      data: [
        { trust_weight: 0.1 },
        { trust_weight: 0.1 },
        { trust_weight: 0.1 },
      ],
      error: null,
    });
    expect(await getSbtTrustBonus('u1')).toBe(SBT_BONUS_CAP);
  });

  it('floors negative weights at 0', async () => {
    setResult({ data: [{ trust_weight: -0.5 }], error: null });
    expect(await getSbtTrustBonus('u1')).toBe(0);
  });

  it('ignores non-numeric trust_weight gracefully', async () => {
    setResult({
      data: [{ trust_weight: 'abc' }, { trust_weight: 0.05 }],
      error: null,
    });
    expect(await getSbtTrustBonus('u1')).toBeCloseTo(0.05, 5);
  });

  it('applySbtBonus multiplies base by (1 + bonus)', () => {
    expect(applySbtBonus(1, 0.1)).toBeCloseTo(1.1, 5);
    expect(applySbtBonus(2, 0.05)).toBeCloseTo(2.1, 5);
  });

  it('applySbtBonus enforces cap and non-negative', () => {
    expect(applySbtBonus(1, 1)).toBeCloseTo(1 + SBT_BONUS_CAP, 5);
    expect(applySbtBonus(1, -0.5)).toBeCloseTo(1, 5);
  });
});
