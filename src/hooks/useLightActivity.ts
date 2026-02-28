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
}

interface CamlyEarned {
  total: number;
  pending: number;
  approved: number;
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
  // NEW: BASE_REWARDS breakdown
  funBreakdown: Record<string, number>;
  totalFunReward: number;
  alreadyMintedFun: number;
  // PPLP v2: Multipliers & Light Level
  lightLevel: string;
  reputationWeight: number;
  consistencyMultiplier: number;
  consistencyDays: number;
  sequenceBonus: number;
  rawScore: number;
}

export interface UseLightActivityReturn {
  activity: LightActivity | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ===== CONSTANTS =====

const MIN_LIGHT_SCORE = 60;
const MIN_ACTIVITIES = 10;
const MINT_COOLDOWN_HOURS = 24;

// BASE_REWARDS per action (FUN, not atomic)
const BASE_REWARDS_FUN: Record<string, number> = {
  views: 10,
  likes: 5,
  comments: 15,
  shares: 20,
  uploads: 100
};

// ===== HELPER FUNCTIONS =====

function calculatePillarsFromActivity(
  counts: ActivityCounts,
  accountAgeDays: number,
  isVerified: boolean,
  totalCamly: number
): PillarScores {
  const totalActivities = counts.views + counts.likes + counts.comments + counts.shares + counts.uploads;
  
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

function calculateMintableFun(
  activityCounts: ActivityCounts,
  alreadyMintedFun: number
): { atomic: string; formatted: string; totalReward: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    views: activityCounts.views * BASE_REWARDS_FUN.views,
    likes: activityCounts.likes * BASE_REWARDS_FUN.likes,
    comments: activityCounts.comments * BASE_REWARDS_FUN.comments,
    shares: activityCounts.shares * BASE_REWARDS_FUN.shares,
    uploads: activityCounts.uploads * BASE_REWARDS_FUN.uploads
  };
  const totalReward = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const mintable = Math.max(0, totalReward - alreadyMintedFun);
  const atomicBigInt = BigInt(Math.floor(mintable)) * BigInt(1e18);
  
  return {
    atomic: atomicBigInt.toString(),
    formatted: mintable.toFixed(2),
    totalReward,
    breakdown
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
          .select('created_at, avatar_verified, suspicious_score, last_fun_mint_at, light_score, light_score_details')
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

        // FUN_PLAY mint requests breakdown
        (supabase as any)
          .from('mint_requests')
          .select('action_type, calculated_amount_formatted, status')
          .eq('user_id', userId)
          .eq('platform_id', 'FUN_PLAY'),

        // Total FUN already minted (all platforms, non-rejected)
        (supabase as any)
          .from('mint_requests')
          .select('calculated_amount_formatted, status')
          .eq('user_id', userId)
          .neq('status', 'rejected')
      ]);

      if (profileResult.error) throw profileResult.error;
      if (activitySummaryResult.error) throw activitySummaryResult.error;

      const profile = profileResult.data;
      const summary = activitySummaryResult.data as Record<string, number> | null;
      const hasPendingRequest = (pendingRequestResult.data?.length || 0) > 0;

      // Build FUN minted by action breakdown
      const funPlayRequests = (funPlayRequestsResult.data || []) as Array<{
        action_type: string;
        calculated_amount_formatted: string;
        status: string;
      }>;
      const funMintedByAction: Record<string, { count: number; totalFun: string }> = {};
      for (const req of funPlayRequests) {
        if (!funMintedByAction[req.action_type]) {
          funMintedByAction[req.action_type] = { count: 0, totalFun: '0' };
        }
        funMintedByAction[req.action_type].count++;
        const current = parseFloat(funMintedByAction[req.action_type].totalFun);
        const add = parseFloat((req.calculated_amount_formatted || '0').replace(' FUN', ''));
        funMintedByAction[req.action_type].totalFun = (current + add).toFixed(2);
      }

      // Calculate total FUN already minted (non-rejected)
      const allMintRequests = (mintedFunResult.data || []) as Array<{
        calculated_amount_formatted: string;
        status: string;
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
        uploads: Number(summary?.uploads || 0)
      };

      const totalCamly = Number(summary?.total_camly || 0);
      const approvedCamly = Number(summary?.approved_camly || 0);
      const pendingCamly = Number(summary?.pending_camly || 0);

      // Calculate account age
      const createdAt = new Date(profile.created_at);
      const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const totalActivities = activityCounts.views + activityCounts.likes + 
        activityCounts.comments + activityCounts.shares + activityCounts.uploads;

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

      // Calculate mintable FUN
      const mintable = calculateMintableFun(activityCounts, alreadyMintedFun);

      // Determine if user can mint (with cooldown enforcement)
      let canMint = true;
      let mintBlockReason: string | undefined;

      if (hasPendingRequest) {
        canMint = false;
        mintBlockReason = 'Bạn đã có request đang chờ duyệt';
      } else if ((profile.light_score ?? lightScore) < MIN_LIGHT_SCORE) {
        canMint = false;
        mintBlockReason = `Light Score (${profile.light_score ?? lightScore}) phải >= ${MIN_LIGHT_SCORE}`;
      } else if (totalActivities < MIN_ACTIVITIES) {
        canMint = false;
        mintBlockReason = `Cần ít nhất ${MIN_ACTIVITIES} activities`;
      } else if (integrityScore === 0) {
        canMint = false;
        mintBlockReason = 'Tài khoản bị đánh dấu đáng ngờ';
      } else if (parseFloat(mintable.formatted) < 1) {
        canMint = false;
        mintBlockReason = 'Số FUN có thể mint quá nhỏ (< 1 FUN)';
      } else if (profile.last_fun_mint_at) {
        // Enforce 24-hour cooldown between mints
        const lastMint = new Date(profile.last_fun_mint_at);
        const hoursSinceLastMint = (Date.now() - lastMint.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMint < MINT_COOLDOWN_HOURS) {
          canMint = false;
          mintBlockReason = `Cần đợi ${Math.ceil(MINT_COOLDOWN_HOURS - hoursSinceLastMint)} giờ nữa để mint tiếp`;
        }
      }

      // Extract server-side details if available
      const serverDetails = profile.light_score_details as Record<string, any> | null;
      const serverLightScore = profile.light_score ?? lightScore;
      const serverLightLevel = serverDetails?.light_level || 'presence';
      const serverRepWeight = Number(serverDetails?.reputation_weight || 1);
      const serverConsistMult = Number(serverDetails?.consistency_multiplier || 1);
      const serverConsistDays = Number(serverDetails?.consistency_days || 0);
      const serverSeqBonus = Number(serverDetails?.sequence_bonus || 0);
      const serverRawScore = Number(serverDetails?.raw_score || 0);

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
