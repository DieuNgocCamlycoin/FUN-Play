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

      // 2. Get base reward for action
      const baseRewardAtomic = getBaseReward(input.platformId, input.actionType);

      // 3. Calculate scores and multipliers
      const scoringResult = scoreAction({
        platformId: input.platformId,
        actionType: input.actionType,
        pillarScores: input.pillarScores,
        unitySignals: input.unitySignals,
        antiSybilScore: input.antiSybilScore ?? 0.9,
        baseRewardAtomic
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
      let query = (supabase as any)
        .from('mint_requests')
        .select('*')
        .order('created_at', { ascending: false });

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

  const submitAutoRequest = useCallback(async (input: AutoMintInput): Promise<{ id: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to submit a request');
      }

      // 2. Calculate multipliers from provided data
      const integrityK = calculateIntegrityMultiplier(0.9, false, 1.0);
      const unityUx = calculateUnityMultiplier(input.unityScore, input.unitySignals);

      // 3. Create evidence from activity summary
      const evidence = {
        type: 'LIGHT_ACTIVITY',
        description: 'Auto-generated from platform light activities',
        data: JSON.stringify(input.activitySummary),
        timestamp: new Date().toISOString()
      };

      // 4. Create hashes
      const actionHash = createActionHash('LIGHT_ACTIVITY');
      const evidenceHash = createEvidenceHash({
        actionType: 'LIGHT_ACTIVITY',
        timestamp: Math.floor(Date.now() / 1000),
        pillars: pillarScoresToRecord(input.pillars),
        metadata: evidence
      });

      // 5. Insert into database
      const insertData = {
        user_id: user.id,
        user_wallet_address: input.userWalletAddress,
        platform_id: 'FUN_PROFILE',
        action_type: 'LIGHT_ACTIVITY',
        action_evidence: evidence,
        pillar_scores: input.pillars,
        light_score: input.lightScore,
        unity_score: input.unityScore,
        unity_signals: input.unitySignals,
        multiplier_q: 1.0,
        multiplier_i: 1.0,
        multiplier_k: integrityK,
        multiplier_ux: unityUx,
        base_reward_atomic: input.mintableFunAtomic,
        calculated_amount_atomic: input.mintableFunAtomic,
        calculated_amount_formatted: formatFunAmount(input.mintableFunAtomic),
        action_hash: actionHash,
        evidence_hash: evidenceHash,
        status: 'pending',
        decision_reason: null
      };

      const { data, error: insertError } = await (supabase as any)
        .from('mint_requests')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 6. Update last mint timestamp on profile
      await supabase
        .from('profiles')
        .update({ last_fun_mint_at: new Date().toISOString() })
        .eq('id', user.id);

      return { id: data.id };

    } catch (err: any) {
      setError(err.message || 'Gửi yêu cầu tự động thất bại');
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

// ===== ADMIN HOOK =====

export interface UseAdminMintRequestReturn {
  loading: boolean;
  error: string | null;
  getPendingRequests: () => Promise<MintRequest[]>;
  getAllRequests: (status?: string, limit?: number) => Promise<MintRequest[]>;
  updateStatus: (id: string, status: string, reason?: string) => Promise<boolean>;
  saveMintResult: (id: string, txHash: string, attesterAddress: string) => Promise<boolean>;
}

export function useAdminMintRequest(): UseAdminMintRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get all pending requests (admin only)
   */
  const getPendingRequests = useCallback(async (): Promise<MintRequest[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('mint_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

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
   * Get all requests with optional filter (admin only)
   */
  const getAllRequests = useCallback(async (status?: string, limit: number = 50): Promise<MintRequest[]> => {
    setLoading(true);
    setError(null);

    try {
      let query = (supabase as any)
        .from('mint_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

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
   * Update request status (admin only)
   */
  const updateStatus = useCallback(async (id: string, status: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('mint_requests')
        .update({
          status,
          decision_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return true;

    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save mint transaction result (admin only)
   */
  const saveMintResult = useCallback(async (id: string, txHash: string, attesterAddress: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await (supabase as any)
        .from('mint_requests')
        .update({
          status: 'minted',
          tx_hash: txHash,
          attester_address: attesterAddress,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          minted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return true;

    } catch (err: any) {
      setError(err.message || 'Không thể lưu kết quả mint');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPendingRequests,
    getAllRequests,
    updateStatus,
    saveMintResult
  };
}
