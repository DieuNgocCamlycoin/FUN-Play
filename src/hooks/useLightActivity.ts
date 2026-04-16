/**
 * Light Activity Hook
 * Automatically calculates user's light activity and mintable FUN
 * Uses server-side RPC for accurate aggregation (no 1000-row limit)
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateLightScore, 
  calculateUnityScore,
  calculateIntegrityMultiplier,
  calculateUnityMultiplier,
  scoreAction,
  BASE_REWARDS,
  type PillarScores,
  type UnitySignals
} from '@/lib/fun-money/pplp-engine';

// ===== TYPES =====

interface ActivityCounts {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  uploads: number;
  posts: number;
}

interface CamlyEarned {
  total: number;
  pending: number;
  approved: number;
}

export interface PlatformBreakdown {
  FUN_PLAY: { count: number; totalFun: number };
  FUN_ANGEL: { count: number; totalFun: number };
  FUN_MAIN: { count: number; totalFun: number };
  FUN_PROFILE: { count: number; totalFun: number };
}

export interface LightActivity {
  activityCounts: ActivityCounts;
  totalActivities: number;
  camlyEarned: CamlyEarned;
  pillars: PillarScores;
  unitySignals: Partial<UnitySignals>;
  lightScore: number;
  unityScore: number;
  integrityScore: number;
  mintableFun: string;
  mintableFunAtomic: string;
  canMint: boolean;
  mintBlockReason?: string;
  accountAgeDays: number;
  isVerified: boolean;
  hasPendingRequest: boolean;
  lastMintAt: string | null;
  funMintedByAction: Record<string, { count: number; totalFun: string }>;
  // BASE_REWARDS breakdown (before multipliers)
  funBreakdown: Record<string, number>;
  totalFunReward: number;
  alreadyMintedFun: number;
  // LS-Math v1.0: breakdown after multipliers
  multipliedBreakdown: Record<string, number>;
  totalMultipliedReward: number;
  appliedMultipliers: { Q: number; I: number; K: number; Ux: number; mCons: number; mSeq: number; penalty: number };
  // PPLP v2: Multipliers & Light Level
  lightLevel: string;
  reputationWeight: number;
  consistencyMultiplier: number;
  consistencyDays: number;
  sequenceBonus: number;
  rawScore: number;
  // Cross-platform aggregation
  platformBreakdown?: PlatformBreakdown;
}

export interface UseLightActivityReturn {
  activity: LightActivity | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ===== CONSTANTS =====

const MIN_LIGHT_SCORE = 10;
const MIN_ACTIVITIES = 10;
const MINT_COOLDOWN_HOURS = 24;

// Map activity keys to FUN_PLAY action types in BASE_REWARDS
const ACTIVITY_TO_ACTION: Record<string, string> = {
  views: 'WATCH_VIDEO',
  likes: 'LIKE_VIDEO',
  comments: 'COMMENT',
  shares: 'SHARE',
  uploads: 'UPLOAD_VIDEO',
  posts: 'CREATE_POST'
};

// ===== HELPER FUNCTIONS =====

function calculatePillarsFromActivity(
  counts: ActivityCounts,
  accountAgeDays: number,
  isVerified: boolean,
  totalCamly: number
): PillarScores {
  const totalActivities = counts.views + counts.likes + counts.comments + counts.shares + counts.uploads + counts.posts;
  
  const S = Math.min(100, Math.round(
    (counts.uploads * 15) + (counts.comments * 2) + 30
  ));
  
  const T = Math.min(100, Math.round(
    (isVerified ? 30 : 0) +
    (Math.min(accountAgeDays, 365) / 365 * 40) + 30
  ));
  
  const H = Math.min(100, Math.round(
    Math.min(counts.likes, 100) * 0.5 +
    Math.min(counts.views, 500) * 0.05 + 30
  ));
  
  const C = Math.min(100, Math.round(
    Math.log10(totalActivities + 1) * 20 +
    Math.log10(totalCamly + 1) * 5 + 30
  ));
  
  const U = Math.min(100, Math.round(
    Math.min(counts.comments, 50) * 1 +
    Math.min(counts.shares, 20) * 2 + 20
  ));
  
  return { S, T, H, C, U };
}

function deriveUnitySignals(counts: ActivityCounts): Partial<UnitySignals> {
  return {
    collaboration: counts.uploads >= 3,
    beneficiaryConfirmed: counts.comments >= 10,
    communityEndorsement: counts.likes >= 50,
    bridgeValue: counts.shares >= 5
  };
}

interface MintableFunResult {
  atomic: string;
  formatted: string;
  totalReward: number;
  breakdown: Record<string, number>;
  multipliedBreakdown: Record<string, number>;
  totalMultipliedReward: number;
  appliedMultipliers: { Q: number; I: number; K: number; Ux: number; mCons: number; mSeq: number; penalty: number };
}

function calculateMintableFun(
  activityCounts: ActivityCounts,
  alreadyMintedFun: number,
  pillars: PillarScores,
  unitySignals: Partial<UnitySignals>,
  antiSybilScore: number,
  streakDays: number,
  sequenceBonus: number,
  riskScore: number
): MintableFunResult {
  const breakdown: Record<string, number> = {};
  const multipliedBreakdown: Record<string, number> = {};
  let firstResult: any = null;

  for (const [actKey, actionType] of Object.entries(ACTIVITY_TO_ACTION)) {
    const count = activityCounts[actKey as keyof ActivityCounts];
    const baseRewardAtomic = BASE_REWARDS.FUN_PLAY[actionType];
    if (!baseRewardAtomic || count === 0) {
      breakdown[actKey] = 0;
      multipliedBreakdown[actKey] = 0;
      continue;
    }

    // Base FUN (no multipliers)
    const baseFun = Number(BigInt(baseRewardAtomic) / BigInt(1e18));
    breakdown[actKey] = count * baseFun;

    // Score one action with full LS-Math pipeline, then multiply by count
    const result = scoreAction({
      platformId: 'FUN_PLAY',
      actionType,
      pillarScores: pillars,
      unitySignals,
      antiSybilScore,
      baseRewardAtomic,
      streakDays,
      sequenceBonus,
      riskScore
    });
    if (!firstResult) firstResult = result;

    const perActionFun = Number(BigInt(result.calculatedAmountAtomic) / BigInt(1e14)) / 10000;
    multipliedBreakdown[actKey] = Math.round(count * perActionFun * 100) / 100;
  }

  const totalReward = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const totalMultipliedReward = Object.values(multipliedBreakdown).reduce((s, v) => s + v, 0);
  const mintable = Math.max(0, totalMultipliedReward - alreadyMintedFun);
  const atomicBigInt = BigInt(Math.floor(mintable)) * BigInt(1e18);

  // Extract applied multipliers from first scored action
  const muls = firstResult?.multipliers ?? { Q: 1, I: 1, K: 1, Ux: 1 };
  const mCons = Math.round((1 + 0.6 * (1 - Math.exp(-streakDays / 30))) * 10000) / 10000;
  const mSeq = Math.round((1 + 0.5 * Math.tanh(sequenceBonus / 5)) * 10000) / 10000;
  const penalty = Math.round((1 - Math.min(0.5, 0.8 * riskScore)) * 10000) / 10000;

  return {
    atomic: atomicBigInt.toString(),
    formatted: mintable.toFixed(2),
    totalReward,
    breakdown,
    multipliedBreakdown,
    totalMultipliedReward,
    appliedMultipliers: { Q: muls.Q, I: muls.I, K: muls.K, Ux: muls.Ux, mCons, mSeq, penalty }
  };
}

// ===== MAIN HOOK =====

export function useLightActivity(userId: string | undefined): UseLightActivityReturn {
  const [activity, setActivity] = useState<LightActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!userId) {
      setActivity(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel - using RPC for activity summary
      const [
        profileResult,
        activitySummaryResult,
        pendingRequestResult,
        funPlayRequestsResult,
        mintedFunResult
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at, avatar_verified, suspicious_score, last_fun_mint_at, light_score, light_score_details, pplp_accepted_at')
          .eq('id', userId)
          .single(),
        
        // Use server-side RPC to avoid 1000-row limit
        supabase.rpc('get_user_activity_summary', { p_user_id: userId }),
        
        supabase
          .from('mint_requests')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(1),

        // Cross-platform mint requests breakdown (ALL platforms)
        (supabase as any)
          .from('mint_requests')
          .select('action_type, calculated_amount_formatted, status, platform_id')
          .eq('user_id', userId)
          .in('platform_id', ['FUN_PLAY', 'FUN_ANGEL', 'FUN_MAIN', 'FUN_PROFILE']),

        // Total FUN already minted (ALL platforms, non-rejected)
        (supabase as any)
          .from('mint_requests')
          .select('calculated_amount_formatted, status, platform_id')
          .eq('user_id', userId)
          .in('platform_id', ['FUN_PLAY', 'FUN_ANGEL', 'FUN_MAIN', 'FUN_PROFILE'])
          .neq('status', 'rejected')
      ]);

      if (profileResult.error) throw profileResult.error;
      if (activitySummaryResult.error) throw activitySummaryResult.error;

      const profile = profileResult.data;
      const summary = activitySummaryResult.data as Record<string, number> | null;
      const hasPendingRequest = (pendingRequestResult.data?.length || 0) > 0;

      // Build FUN minted by action breakdown (cross-platform)
      const allPlatformRequests = (funPlayRequestsResult.data || []) as Array<{
        action_type: string;
        calculated_amount_formatted: string;
        status: string;
        platform_id: string;
      }>;
      const funMintedByAction: Record<string, { count: number; totalFun: string }> = {};
      const platformBreakdown: PlatformBreakdown = {
        FUN_PLAY: { count: 0, totalFun: 0 },
        FUN_ANGEL: { count: 0, totalFun: 0 },
        FUN_MAIN: { count: 0, totalFun: 0 },
        FUN_PROFILE: { count: 0, totalFun: 0 },
      };
      for (const req of allPlatformRequests) {
        if (!funMintedByAction[req.action_type]) {
          funMintedByAction[req.action_type] = { count: 0, totalFun: '0' };
        }
        funMintedByAction[req.action_type].count++;
        const add = parseFloat((req.calculated_amount_formatted || '0').replace(' FUN', ''));
        const current = parseFloat(funMintedByAction[req.action_type].totalFun);
        funMintedByAction[req.action_type].totalFun = (current + add).toFixed(2);

        // Platform breakdown
        const pid = (req.platform_id || 'FUN_PLAY') as keyof PlatformBreakdown;
        if (platformBreakdown[pid]) {
          platformBreakdown[pid].count++;
          platformBreakdown[pid].totalFun += add;
        }
      }

      // Calculate total FUN already minted (cross-platform, non-rejected)
      const allMintRequests = (mintedFunResult.data || []) as Array<{
        calculated_amount_formatted: string;
        status: string;
        platform_id: string;
      }>;
      let alreadyMintedFun = 0;
      for (const req of allMintRequests) {
        alreadyMintedFun += parseFloat((req.calculated_amount_formatted || '0').replace(' FUN', ''));
      }

      // Parse activity summary from RPC
      const activityCounts: ActivityCounts = {
        views: Number(summary?.views || 0),
        likes: Number(summary?.likes || 0),
        comments: Number(summary?.comments || 0),
        shares: Number(summary?.shares || 0),
        uploads: Number(summary?.uploads || 0),
        posts: Number(summary?.posts || 0)
      };

      const totalCamly = Number(summary?.total_camly || 0);
      const approvedCamly = Number(summary?.approved_camly || 0);
      const pendingCamly = Number(summary?.pending_camly || 0);

      // Calculate account age
      const createdAt = new Date(profile.created_at);
      const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const totalActivities = activityCounts.views + activityCounts.likes + 
        activityCounts.comments + activityCounts.shares + activityCounts.uploads + activityCounts.posts;

      // Calculate pillars and scores
      const isVerified = profile.avatar_verified || false;
      const pillars = calculatePillarsFromActivity(activityCounts, accountAgeDays, isVerified, totalCamly);
      const unitySignals = deriveUnitySignals(activityCounts);
      
      const lightScore = calculateLightScore(pillars);
      const unityScore = calculateUnityScore(unitySignals);
      const integrityScore = calculateIntegrityMultiplier(
        1 - (profile.suspicious_score || 0) / 10,
        false,
        1.0
      );
      const unityMultiplier = calculateUnityMultiplier(unityScore, unitySignals);

      // Extract server-side details if available
      const serverDetails = profile.light_score_details as Record<string, any> | null;
      const serverLightScore = profile.light_score ?? lightScore;
      const serverLightLevel = serverDetails?.light_level || 'presence';
      const serverRepWeight = Number(serverDetails?.reputation_weight || 1);
      const serverConsistMult = Number(serverDetails?.consistency_multiplier || 1);
      const serverConsistDays = Number(serverDetails?.consistency_days || 0);
      const serverSeqBonus = Number(serverDetails?.sequence_bonus || 0);
      const serverRawScore = Number(serverDetails?.raw_score || 0);

      // Calculate mintable FUN with full LS-Math multipliers
      const riskScore = (profile.suspicious_score || 0) / 10;
      const mintable = calculateMintableFun(
        activityCounts, alreadyMintedFun, pillars, unitySignals,
        1 - riskScore, serverConsistDays, serverSeqBonus, riskScore
      );

      // Determine if user can mint (with cooldown enforcement)
      let canMint = true;
      let mintBlockReason: string | undefined;

      // PPLP Charter gate — must accept charter before minting
      const pplpAcceptedAt = (profile as any).pplp_accepted_at;

      if (!pplpAcceptedAt) {
        canMint = false;
        mintBlockReason = '🌱 Hãy chấp nhận Hiến chương PPLP trước nhé! Đây là bước đầu tiên trên hành trình ánh sáng của bạn ✨';
      } else if (hasPendingRequest) {
        canMint = false;
        mintBlockReason = '⏳ Yêu cầu trước của bạn đang được xử lý rồi nè! Chờ chút xíu nhé, Admin đang lo cho bạn 💛';
      } else if ((profile.light_score ?? lightScore) < MIN_LIGHT_SCORE) {
        canMint = false;
        mintBlockReason = `🌟 Điểm Ánh Sáng của bạn đang là ${profile.light_score ?? lightScore}/${MIN_LIGHT_SCORE}. Hãy tiếp tục xem video, đăng bài và tương tác để tỏa sáng hơn nha! 💪`;
      } else if (totalActivities < MIN_ACTIVITIES) {
        canMint = false;
        mintBlockReason = '🎯 Bạn cần thêm hoạt động nữa nè! Hãy xem video, like, bình luận và chia sẻ để đủ điều kiện mint nhé 🌈';
      } else if (integrityScore === 0) {
        canMint = false;
        mintBlockReason = '🔒 Tài khoản cần được xác minh thêm. Hãy liên hệ Admin để được hỗ trợ nhé! 🙏';
      } else if (parseFloat(mintable.formatted) < 1) {
        canMint = false;
        mintBlockReason = '💫 Bạn gần đạt rồi! Cần tích lũy thêm một chút hoạt động để đủ 1 FUN mint nhé, cố lên! 🚀';
      } else if (profile.last_fun_mint_at) {
        const lastMint = new Date(profile.last_fun_mint_at);
        const hoursSinceLastMint = (Date.now() - lastMint.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMint < MINT_COOLDOWN_HOURS) {
          canMint = false;
          mintBlockReason = `⏰ Bạn vừa mint xong rồi nè! Nghỉ ngơi ${Math.ceil(MINT_COOLDOWN_HOURS - hoursSinceLastMint)} giờ nữa rồi quay lại mint tiếp nhé, Angel chờ bạn! 🤗`;
        }
      }

      setActivity({
        activityCounts,
        totalActivities,
        camlyEarned: {
          total: totalCamly,
          pending: pendingCamly,
          approved: approvedCamly
        },
        pillars,
        unitySignals,
        lightScore: serverLightScore,
        unityScore,
        integrityScore,
        mintableFun: mintable.formatted,
        mintableFunAtomic: mintable.atomic,
        canMint,
        mintBlockReason,
        accountAgeDays,
        isVerified,
        hasPendingRequest,
        lastMintAt: profile.last_fun_mint_at,
        funMintedByAction,
        funBreakdown: mintable.breakdown,
        totalFunReward: mintable.totalReward,
        alreadyMintedFun,
        multipliedBreakdown: mintable.multipliedBreakdown,
        totalMultipliedReward: mintable.totalMultipliedReward,
        appliedMultipliers: mintable.appliedMultipliers,
        lightLevel: serverLightLevel,
        reputationWeight: serverRepWeight,
        consistencyMultiplier: serverConsistMult,
        consistencyDays: serverConsistDays,
        sequenceBonus: serverSeqBonus,
        rawScore: serverRawScore
      });

    } catch (err: any) {
      console.error('Error fetching light activity:', err);
      setError(err.message || 'Failed to fetch activity data');
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity
  };
}
