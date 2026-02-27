/**
 * FUN Money Mint Request Hook
 * SDK v1.0
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PillarScores, UnitySignals } from '@/lib/fun-money/pplp-engine';
import { 
  scoreAction, 
  getBaseReward,
  calculateLightScore,
  calculateUnityScore,
  calculateIntegrityMultiplier,
  calculateUnityMultiplier,
  formatFunAmount,
  type ScoringResult 
} from '@/lib/fun-money/pplp-engine';
import { createActionHash, createEvidenceHash } from '@/lib/fun-money/eip712-signer';

// ===== TYPES =====

export interface MintRequestInput {
  platformId: string;
  actionType: string;
  userWalletAddress: string;
  evidence: {
    type: string;
    description: string;
    urls?: string[];
    data?: string;
  };
  pillarScores: PillarScores;
  unitySignals: Partial<UnitySignals>;
  antiSybilScore?: number;
  qualityMultiplier?: number;
  impactMultiplier?: number;
  /** LS-Math v1.0: streak days for consistency multiplier */
  streakDays?: number;
  /** LS-Math v1.0: sequence bonus total */
  sequenceBonus?: number;
  /** LS-Math v1.0: risk score (0-1) */
  riskScore?: number;
  /** PPLP v2.0: validation flags */
  pplpValidation?: import('@/lib/fun-money/constitution').PPLPValidation;
}

// Auto mint input (1-click from light activity)
export interface AutoMintInput {
  userWalletAddress: string;
  pillars: PillarScores;
  lightScore: number;
  unityScore: number;
  unitySignals: Partial<UnitySignals>;
  mintableFunAtomic: string;
  activitySummary: {
    views: number;
    likes: number;
    comments: number;
    shares?: number;
    uploads: number;
  };
}

export interface MintRequest {
  id: string;
  user_id: string;
  user_wallet_address: string;
  platform_id: string;
  action_type: string;
  action_evidence: any;
  pillar_scores: PillarScores;
  light_score: number;
  unity_score: number;
  unity_signals: Partial<UnitySignals>;
  multiplier_q: number;
  multiplier_i: number;
  multiplier_k: number;
  multiplier_ux: number;
  base_reward_atomic: string;
  calculated_amount_atomic: string;
  calculated_amount_formatted: string;
  action_hash: string;
  evidence_hash: string;
  status: 'pending' | 'approved' | 'minted' | 'rejected' | 'failed';
  decision_reason?: string;
  tx_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface UseMintRequestReturn {
  loading: boolean;
  error: string | null;
  submitRequest: (input: MintRequestInput) => Promise<{ id: string; scoringResult: ScoringResult } | null>;
  getMyRequests: (status?: string) => Promise<MintRequest[]>;
  getRequestById: (id: string) => Promise<MintRequest | null>;
}

// Helper to convert PillarScores to Record
function pillarScoresToRecord(pillars: PillarScores): Record<string, number> {
  return {
    S: pillars.S,
    T: pillars.T,
    H: pillars.H,
    C: pillars.C,
    U: pillars.U
  };
}

// ===== HOOK =====

export function useMintRequest(): UseMintRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit a new mint request
   */
  const submitRequest = useCallback(async (input: MintRequestInput): Promise<{ id: string; scoringResult: ScoringResult } | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to submit a request');
      }

      // 1b. Fetch LS-Math data from profile & features if not provided
      let streakDays = input.streakDays ?? 0;
      let sequenceBonus = input.sequenceBonus ?? 0;
      let riskScore = input.riskScore ?? 0;

      if (input.streakDays === undefined || input.sequenceBonus === undefined || input.riskScore === undefined) {
        const { data: features } = await (supabase as any)
          .from('features_user_day')
          .select('consistency_streak, sequence_count, anti_farm_risk')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (features) {
          streakDays = input.streakDays ?? (features.consistency_streak || 0);
          sequenceBonus = input.sequenceBonus ?? (features.sequence_count || 0);
          riskScore = input.riskScore ?? (features.anti_farm_risk || 0);
        }
      }

      // 1c. Build PPLP validation (default: all true for manual form, caller can override)
      const pplpValidation = input.pplpValidation ?? {
        hasRealAction: true,
        hasRealValue: true,
        hasPositiveImpact: true,
        noExploitation: true,
        charterCompliant: true,
      };

      // 2. Get base reward for action
      const baseRewardAtomic = getBaseReward(input.platformId, input.actionType);

      // 3. Calculate scores and multipliers (now with LS-Math v1.0 + PPLP v2.0)
      const scoringResult = scoreAction({
        platformId: input.platformId,
        actionType: input.actionType,
        pillarScores: input.pillarScores,
        unitySignals: input.unitySignals,
        antiSybilScore: input.antiSybilScore ?? 0.9,
        baseRewardAtomic,
        qualityMultiplier: input.qualityMultiplier,
        impactMultiplier: input.impactMultiplier,
        streakDays,
        sequenceBonus,
        riskScore,
        pplpValidation,
      });

      // 4. Create hashes
      const actionHash = createActionHash(input.actionType);
      const evidenceHash = createEvidenceHash({
        actionType: input.actionType,
        timestamp: Math.floor(Date.now() / 1000),
        pillars: pillarScoresToRecord(input.pillarScores),
        metadata: input.evidence
      });

      // 5. Insert into database
      const insertData = {
        user_id: user.id,
        user_wallet_address: input.userWalletAddress,
        platform_id: input.platformId,
        action_type: input.actionType,
        action_evidence: input.evidence,
        pillar_scores: input.pillarScores,
        light_score: scoringResult.lightScore,
        unity_score: scoringResult.unityScore,
        unity_signals: input.unitySignals,
        multiplier_q: scoringResult.multipliers.Q,
        multiplier_i: scoringResult.multipliers.I,
        multiplier_k: scoringResult.multipliers.K,
        multiplier_ux: scoringResult.multipliers.Ux,
        base_reward_atomic: baseRewardAtomic,
        calculated_amount_atomic: scoringResult.calculatedAmountAtomic,
        calculated_amount_formatted: scoringResult.calculatedAmountFormatted,
        action_hash: actionHash,
        evidence_hash: evidenceHash,
        status: scoringResult.decision === 'REJECT' ? 'rejected' : 'pending',
        decision_reason: scoringResult.reasonCodes.join(', ') || null
      };

      const { data, error: insertError } = await (supabase as any)
        .from('mint_requests')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return {
        id: data.id,
        scoringResult
      };

    } catch (err: any) {
      setError(err.message || 'Gửi yêu cầu thất bại');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user's mint requests
   */
  const getMyRequests = useCallback(async (status?: string): Promise<MintRequest[]> => {
    setLoading(true);
    setError(null);

    try {
      // Lấy user hiện tại để filter theo user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = (supabase as any)
        .from('mint_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return (data || []) as unknown as MintRequest[];

    } catch (err: any) {
      setError(err.message || 'Không thể tải yêu cầu');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a specific request by ID
   */
  const getRequestById = useCallback(async (id: string): Promise<MintRequest | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('mint_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return data as unknown as MintRequest;

    } catch (err: any) {
      setError(err.message || 'Không thể tải yêu cầu');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    submitRequest,
    getMyRequests,
    getRequestById
  };
}

// ===== AUTO MINT HOOK (1-Click from Light Activity) =====

export interface UseAutoMintRequestReturn {
  loading: boolean;
  error: string | null;
  submitAutoRequest: (input: AutoMintInput) => Promise<{ id: string } | null>;
}

export function useAutoMintRequest(): UseAutoMintRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAutoRequest = useCallback(async (input: AutoMintInput): Promise<{ id: string; error?: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Bạn cần đăng nhập để gửi yêu cầu mint');
      }

      // 2. Fetch LS-Math data from features_user_day
      const { data: features } = await (supabase as any)
        .from('features_user_day')
        .select('consistency_streak, sequence_count, anti_farm_risk')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const streakDays = features?.consistency_streak || 0;
      const sequenceBonus = features?.sequence_count || 0;
      const riskScore = features?.anti_farm_risk || 0;

      // 3. PPLP v2.0 validation
      const pplpValidation = {
        hasRealAction: true,
        hasRealValue: input.activitySummary.views > 0 || input.activitySummary.uploads > 0 || input.activitySummary.comments > 0,
        hasPositiveImpact: true,
        noExploitation: riskScore < 0.4,
        charterCompliant: true,
      };

      // 4. Route through scoreAction() instead of bypassing
      const baseRewardAtomic = input.mintableFunAtomic;
      const scoringResult = scoreAction({
        platformId: 'FUN_PROFILE',
        actionType: 'LIGHT_ACTIVITY',
        pillarScores: input.pillars,
        unitySignals: input.unitySignals,
        antiSybilScore: 0.9,
        baseRewardAtomic,
        qualityMultiplier: 1.0,
        impactMultiplier: 1.0,
        streakDays,
        sequenceBonus,
        riskScore,
        pplpValidation,
      });

      // If rejected by scoring engine, abort
      if (scoringResult.decision === 'REJECT') {
        throw new Error(`Yêu cầu bị từ chối: ${scoringResult.reasonCodes.join(', ')}`);
      }

      // 5. Create evidence from activity summary
      const evidence = {
        type: 'LIGHT_ACTIVITY',
        description: 'Auto-generated from platform light activities',
        data: JSON.stringify(input.activitySummary),
        timestamp: new Date().toISOString()
      };

      // 6. Create hashes
      const actionHash = createActionHash('LIGHT_ACTIVITY');
      const evidenceHash = createEvidenceHash({
        actionType: 'LIGHT_ACTIVITY',
        timestamp: Math.floor(Date.now() / 1000),
        pillars: pillarScoresToRecord(input.pillars),
        metadata: evidence
      });

      // 7. Insert into database using scored results
      const insertData = {
        user_id: user.id,
        user_wallet_address: input.userWalletAddress,
        platform_id: 'FUN_PROFILE',
        action_type: 'LIGHT_ACTIVITY',
        action_evidence: evidence,
        pillar_scores: input.pillars,
        light_score: scoringResult.lightScore,
        unity_score: scoringResult.unityScore,
        unity_signals: input.unitySignals,
        multiplier_q: scoringResult.multipliers.Q,
        multiplier_i: scoringResult.multipliers.I,
        multiplier_k: scoringResult.multipliers.K,
        multiplier_ux: scoringResult.multipliers.Ux,
        base_reward_atomic: baseRewardAtomic,
        calculated_amount_atomic: scoringResult.calculatedAmountAtomic,
        calculated_amount_formatted: scoringResult.calculatedAmountFormatted,
        action_hash: actionHash,
        evidence_hash: evidenceHash,
        status: scoringResult.decision === 'REVIEW_HOLD' ? 'pending' : 'pending',
        decision_reason: scoringResult.reasonCodes.join(', ') || null
      };

      console.log('[MintRequest] Inserting mint request...', { userId: user.id, wallet: input.userWalletAddress, amount: scoringResult.calculatedAmountFormatted });

      const { data, error: insertError } = await (supabase as any)
        .from('mint_requests')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('[MintRequest] Insert error:', insertError);
        throw new Error(insertError.message);
      }

      console.log('[MintRequest] Success! Request ID:', data.id);

      // 8. Update last mint timestamp on profile
      await supabase
        .from('profiles')
        .update({ last_fun_mint_at: new Date().toISOString() })
        .eq('id', user.id);

      return { id: data.id };

    } catch (err: any) {
      const errorMsg = err.message || 'Gửi yêu cầu tự động thất bại';
      console.error('[MintRequest] Error:', errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    submitAutoRequest
  };
}

// Admin hook has been moved to src/hooks/useAdminMintRequest.ts
// Import from there instead: import { useAdminMintRequest } from '@/hooks/useAdminMintRequest';
