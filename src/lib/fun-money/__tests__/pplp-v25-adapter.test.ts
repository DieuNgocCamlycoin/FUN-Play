/**
 * Tests for PPLP v2.5 Mint Adapter
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase BEFORE importing adapter
vi.mock('@/integrations/supabase/client', () => {
  const mockProfile = {
    created_at: new Date(Date.now() - 200 * 86400_000).toISOString(),
    avatar_verified: true,
    light_score: 75,
    suspicious_score: 0,
  };
  const mockFeatures = {
    consistency_streak: 14,
    sequence_count: 3,
    anti_farm_risk: 0.1,
    content_pillar_score: 7,
    avg_rating_weighted: 4.2,
    count_help: 2,
    count_donations: 1,
    count_comments: 5,
    count_shares: 3,
    count_likes_given: 8,
    count_videos: 1,
    count_posts: 2,
    count_reports_valid: 0,
    onchain_value_score: 0,
  };
  const profilesBuilder = {
    select: () => profilesBuilder,
    eq: () => profilesBuilder,
    single: async () => ({ data: mockProfile, error: null }),
  };
  const featuresBuilder = {
    select: () => featuresBuilder,
    eq: () => featuresBuilder,
    order: () => featuresBuilder,
    limit: () => featuresBuilder,
    maybeSingle: async () => ({ data: mockFeatures, error: null }),
  };
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'profiles') return profilesBuilder;
        if (table === 'features_user_day') return featuresBuilder;
        if (table === 'trust_profile') {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { tc: 1.1, tier: 'T2', sybil_risk: 5, fraud_risk: 0 }, error: null }) }),
            }),
          };
        }
        if (table === 'sbt_registry') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [{ trust_weight: 0.05 }, { trust_weight: 0.05 }], error: null }),
              }),
            }),
          };
        }
        return profilesBuilder;
      },
    },
  };
});

import { runV25MintAdapter, mapActionToV25Code, VVU_TO_FUN_RATE } from '../pplp-v25-adapter';

describe('PPLP v2.5 Mint Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps legacy action types to v2.5 codes', () => {
    expect(mapActionToV25Code('WATCH_VIDEO')).toBe('learning_completed');
    expect(mapActionToV25Code('LIKE_VIDEO')).toBe('daily_checkin');
    expect(mapActionToV25Code('UPLOAD_VIDEO')).toBe('content_created');
    expect(mapActionToV25Code('UNKNOWN_ACTION')).toBe('daily_checkin');
  });

  it('produces VVU > 0 and FUN amount within bounds for normal user', async () => {
    const result = await runV25MintAdapter({
      userId: 'test-user-1',
      actionType: 'CREATE_POST',
      walletAddress: '0xabc',
    });

    expect(result.vvu).toBeGreaterThan(0);
    expect(result.funAmount).toBeGreaterThan(0);
    expect(result.funAmount).toBeLessThanOrEqual(5000);
    expect(result.decision).toBe('APPROVE');
    expect(result.metadata.live_tier).toBe('T2');
    expect(result.metadata.live_tc).toBeCloseTo(1.1, 2);
    // SBT bonus capped at 0.15 (2 × 0.05 = 0.10)
    expect(result.metadata.sbt_bonus).toBeCloseTo(0.1, 2);
  });

  it('VVU → FUN conversion uses calibrated rate', async () => {
    const result = await runV25MintAdapter({
      userId: 'test-user-1',
      actionType: 'COMMENT',
      walletAddress: '0xabc',
    });
    // funAmount should approximately equal vvu * rate (within rounding)
    const expected = Math.min(5000, result.vvu * VVU_TO_FUN_RATE);
    expect(result.funAmount).toBeCloseTo(Number(expected.toFixed(4)), 2);
  });

  it('returns full audit metadata', async () => {
    const result = await runV25MintAdapter({
      userId: 'test-user-1',
      actionType: 'WATCH_VIDEO',
      walletAddress: '0xabc',
    });
    expect(result.metadata).toMatchObject({
      action_code: 'learning_completed',
      base_value: expect.any(Number),
      quality: expect.any(Number),
      trust: expect.any(Number),
      iis: expect.any(Number),
      im: expect.any(Number),
      aaf: expect.any(Number),
      erp: expect.any(Number),
    });
  });
});
