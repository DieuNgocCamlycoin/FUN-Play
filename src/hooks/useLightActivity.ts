/**
 * Light Activity Hook
 * Automatically calculates user's light activity and mintable FUN
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
  // Activity counts
  activityCounts: ActivityCounts;
  totalActivities: number;
  
  // CAMLY earned
  camlyEarned: CamlyEarned;
  
  // Calculated pillars (auto from activities)
  pillars: PillarScores;
  
  // Unity signals (derived)
  unitySignals: Partial<UnitySignals>;
  
  // Scores
  lightScore: number;
  unityScore: number;
  integrityScore: number;
  
  // Mintable FUN
  mintableFun: string; // formatted
  mintableFunAtomic: string;
  mintableFunUsd: string;
  
  // Status
  canMint: boolean;
  mintBlockReason?: string;
  
  // Profile info
  accountAgeDays: number;
  isVerified: boolean;
  hasPendingRequest: boolean;
  lastMintAt: string | null;
}

export interface UseLightActivityReturn {
  activity: LightActivity | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ===== CONSTANTS =====

const CAMLY_TO_FUN_RATE = 0.01; // 1 CAMLY = 0.01 FUN
const MIN_LIGHT_SCORE = 60;
const MIN_ACTIVITIES = 10;
const FUN_PRICE_USD = 0.10; // Estimated

// ===== HELPER FUNCTIONS =====

/**
 * Calculate pillars automatically from activity data
 */
function calculatePillarsFromActivity(
  counts: ActivityCounts,
  accountAgeDays: number,
  isVerified: boolean,
  totalCamly: number
): PillarScores {
  const totalActivities = counts.views + counts.likes + counts.comments + counts.shares + counts.uploads;
  
  // S (Service): Based on uploads and quality comments
  const S = Math.min(100, Math.round(
    (counts.uploads * 15) + 
    (counts.comments * 2) + 
    30 // base
  ));
  
  // T (Truth): Based on verification, account age
  const T = Math.min(100, Math.round(
    (isVerified ? 30 : 0) +
    (Math.min(accountAgeDays, 365) / 365 * 40) +
    30 // base
  ));
  
  // H (Healing): Based on positive ratio (likes given)
  const H = Math.min(100, Math.round(
    Math.min(counts.likes, 100) * 0.5 +
    Math.min(counts.views, 500) * 0.05 +
    30 // base
  ));
  
  // C (Contribution): Based on total engagement
  const C = Math.min(100, Math.round(
    Math.log10(totalActivities + 1) * 20 +
    Math.log10(totalCamly + 1) * 5 +
    30 // base
  ));
  
  // U (Unity): Based on community interactions
  const U = Math.min(100, Math.round(
    Math.min(counts.comments, 50) * 1 +
    Math.min(counts.shares, 20) * 2 +
    20 // base
  ));
  
  return { S, T, H, C, U };
}

/**
 * Derive unity signals from activity
 */
function deriveUnitySignals(counts: ActivityCounts): Partial<UnitySignals> {
  return {
    collaboration: counts.uploads >= 3,
    beneficiaryConfirmed: counts.comments >= 10,
    communityEndorsement: counts.likes >= 50,
    bridgeValue: counts.shares >= 5
  };
}

/**
 * Calculate mintable FUN from activities
 */
function calculateMintableFun(
  totalCamly: number,
  lightScore: number,
  integrityScore: number,
  unityMultiplier: number
): { atomic: string; formatted: string; usd: string } {
  // Base FUN = CAMLY * rate
  const baseFun = totalCamly * CAMLY_TO_FUN_RATE;
  
  // Apply light score and multipliers
  const multiplier = (lightScore / 100) * integrityScore * unityMultiplier;
  const finalFun = baseFun * multiplier;
  
  // Convert to atomic (18 decimals)
  const atomicBigInt = BigInt(Math.floor(finalFun * 1e18));
  
  // Format for display
  const formatted = finalFun.toFixed(2);
  const usd = (finalFun * FUN_PRICE_USD).toFixed(2);
  
  return {
    atomic: atomicBigInt.toString(),
    formatted,
    usd
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
      // Fetch all data in parallel
      const [
        profileResult,
        transactionsResult,
        pendingRequestResult
      ] = await Promise.all([
        // User profile
        supabase
          .from('profiles')
          .select('created_at, avatar_verified, suspicious_score, last_fun_mint_at')
          .eq('id', userId)
          .single(),
        
        // Reward transactions
        supabase
          .from('reward_transactions')
          .select('reward_type, amount, approved, status')
          .eq('user_id', userId),
        
        // Check pending mint requests
        supabase
          .from('mint_requests')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(1)
      ]);

      if (profileResult.error) throw profileResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      const profile = profileResult.data;
      const transactions = transactionsResult.data || [];
      const hasPendingRequest = (pendingRequestResult.data?.length || 0) > 0;

      // Calculate account age
      const createdAt = new Date(profile.created_at);
      const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Aggregate activity counts and CAMLY
      const activityCounts: ActivityCounts = { views: 0, likes: 0, comments: 0, shares: 0, uploads: 0 };
      let totalCamly = 0;
      let pendingCamly = 0;
      let approvedCamly = 0;

      transactions.forEach((tx: any) => {
        const type = tx.reward_type?.toUpperCase();
        const amount = tx.amount || 0;
        
        totalCamly += amount;
        if (tx.approved) {
          approvedCamly += amount;
        } else {
          pendingCamly += amount;
        }

        switch (type) {
          case 'VIEW': activityCounts.views++; break;
          case 'LIKE': activityCounts.likes++; break;
          case 'COMMENT': activityCounts.comments++; break;
          case 'SHARE': activityCounts.shares++; break;
          case 'UPLOAD': activityCounts.uploads++; break;
        }
      });

      const totalActivities = activityCounts.views + activityCounts.likes + 
        activityCounts.comments + activityCounts.shares + activityCounts.uploads;

      // Calculate pillars and scores
      const isVerified = profile.avatar_verified || false;
      const pillars = calculatePillarsFromActivity(activityCounts, accountAgeDays, isVerified, totalCamly);
      const unitySignals = deriveUnitySignals(activityCounts);
      
      const lightScore = calculateLightScore(pillars);
      const unityScore = calculateUnityScore(unitySignals);
      const integrityScore = calculateIntegrityMultiplier(
        1 - (profile.suspicious_score || 0) / 10, // Convert to 0-1 scale
        false, // hasStake - not implemented yet
        1.0 // behaviorScore
      );
      const unityMultiplier = calculateUnityMultiplier(unityScore, unitySignals);

      // Calculate mintable FUN
      const mintable = calculateMintableFun(totalCamly, lightScore, integrityScore, unityMultiplier);

      // Determine if user can mint
      let canMint = true;
      let mintBlockReason: string | undefined;

      if (hasPendingRequest) {
        canMint = false;
        mintBlockReason = 'Bạn đã có request đang chờ duyệt';
      } else if (lightScore < MIN_LIGHT_SCORE) {
        canMint = false;
        mintBlockReason = `Light Score (${lightScore}) phải >= ${MIN_LIGHT_SCORE}`;
      } else if (totalActivities < MIN_ACTIVITIES) {
        canMint = false;
        mintBlockReason = `Cần ít nhất ${MIN_ACTIVITIES} activities`;
      } else if (integrityScore === 0) {
        canMint = false;
        mintBlockReason = 'Tài khoản bị đánh dấu đáng ngờ';
      } else if (parseFloat(mintable.formatted) < 1) {
        canMint = false;
        mintBlockReason = 'Số FUN có thể mint quá nhỏ (< 1 FUN)';
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
        lightScore,
        unityScore,
        integrityScore,
        mintableFun: mintable.formatted,
        mintableFunAtomic: mintable.atomic,
        mintableFunUsd: mintable.usd,
        canMint,
        mintBlockReason,
        accountAgeDays,
        isVerified,
        hasPendingRequest,
        lastMintAt: profile.last_fun_mint_at
      });

    } catch (err: any) {
      console.error('Error fetching light activity:', err);
      setError(err.message || 'Failed to fetch activity data');
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-fetch on mount and userId change
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
