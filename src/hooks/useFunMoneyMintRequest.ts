/**
 * useFunMoneyMintRequest — Mint Request Hook
 * SDK v2.0
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
import { createActionHash, createEvidenceHash } from '@/lib/fun-money/web3-config';
import { runV25MintAdapter } from '@/lib/fun-money/pplp-v25-adapter';

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
  /** When true (default), routes through PPLP v2.5 VVU pipeline (live trust + SBT). */
  useV25?: boolean;
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
    posts?: number;
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

      // 1a. Wallet mismatch check: verify wallet matches profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      if (profile?.wallet_address && input.userWalletAddress &&
          profile.wallet_address.toLowerCase() !== input.userWalletAddress.toLowerCase()) {
        throw new Error('Ví bạn đang kết nối không khớp với ví trong hồ sơ. Vui lòng dùng đúng ví đã đăng ký.');
      }

      // 1b. Dedup check: prevent multiple requests of same action_type within 24h (both tables)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: existingMint }, { data: existingPplp }] = await Promise.all([
        (supabase as any)
          .from('mint_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', input.actionType)
          .gte('created_at', twentyFourHoursAgo)
          .not('status', 'in', '("rejected","failed")')
          .limit(1),
        (supabase as any)
          .from('pplp_mint_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', input.actionType)
          .gte('created_at', twentyFourHoursAgo)
          .not('status', 'in', '("rejected","failed")')
          .limit(1),
      ]);

      if ((existingMint && existingMint.length > 0) || (existingPplp && existingPplp.length > 0)) {
        throw new Error(`Bạn đã có yêu cầu mint ${input.actionType} trong 24h qua. Vui lòng chờ.`);
      }

      // ===== PPLP v2.5 ROUTE (default) =====
      if (input.useV25 !== false) {
        const v25 = await runV25MintAdapter({
          userId: user.id,
          actionType: input.actionType,
          walletAddress: input.userWalletAddress,
          evidence: { description: input.evidence.description },
        });

        if (v25.decision === 'REJECT') {
          throw new Error(`Yêu cầu bị từ chối (v2.5): ${v25.reasonCodes.join(', ')}`);
        }

        const actionHash = createActionHash(input.actionType);
        const evidenceHash = createEvidenceHash({
          actionType: input.actionType,
          timestamp: Math.floor(Date.now() / 1000),
          pillars: pillarScoresToRecord(input.pillarScores),
          metadata: { ...input.evidence, vvu: v25.vvu, v25_components: v25.metadata },
        });

        const insertData = {
          user_id: user.id,
          user_wallet_address: input.userWalletAddress,
          platform_id: input.platformId,
          action_type: input.actionType,
          action_evidence: { ...input.evidence, engine: 'pplp-v2.5', v25: v25.metadata },
          pillar_scores: input.pillarScores,
          light_score: v25.vvu, // store VVU as light_score for backward UI compat
          unity_score: v25.metadata.im,
          unity_signals: input.unitySignals,
          multiplier_q: v25.metadata.quality,
          multiplier_i: v25.metadata.iis,
          multiplier_k: v25.metadata.trust,
          multiplier_ux: v25.metadata.aaf * v25.metadata.erp,
          base_reward_atomic: '0',
          calculated_amount_atomic: v25.funAmountAtomic,
          calculated_amount_formatted: `${v25.funAmount} FUN`,
          action_hash: actionHash,
          evidence_hash: evidenceHash,
          status: v25.decision === 'REVIEW_HOLD' ? 'pending' : 'pending',
          decision_reason: v25.reasonCodes.join(', ') || `v2.5 VVU=${v25.vvu.toFixed(3)}`,
        };

        const { data, error: insertError } = await (supabase as any)
          .from('mint_requests')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) throw new Error(insertError.message);

        const v25ScoringResult: ScoringResult = {
          decision: v25.decision === 'REVIEW_HOLD' ? 'REVIEW_HOLD' : 'APPROVE',
          calculatedAmountAtomic: v25.funAmountAtomic,
          calculatedAmountFormatted: `${v25.funAmount} FUN`,
          baseRewardAtomic: '0',
          lightScore: v25.vvu,
          unityScore: v25.metadata.im,
          multipliers: {
            Q: v25.metadata.quality,
            I: v25.metadata.iis,
            K: v25.metadata.trust,
            Ux: v25.metadata.aaf * v25.metadata.erp,
          },
          reasonCodes: v25.reasonCodes,
        } as unknown as ScoringResult;

        return { id: data.id, scoringResult: v25ScoringResult };
      }

      // ===== LEGACY v2.0 ROUTE =====
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

      // 1a. Wallet mismatch check: verify wallet matches profile
      const { data: walletProfile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      if (walletProfile?.wallet_address && input.userWalletAddress &&
          walletProfile.wallet_address.toLowerCase() !== input.userWalletAddress.toLowerCase()) {
        throw new Error('Ví bạn đang kết nối không khớp với ví trong hồ sơ. Vui lòng dùng đúng ví đã đăng ký.');
      }

      // 1b. Dedup check: prevent multiple LIGHT_ACTIVITY requests within 24h (both tables)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: existingMint }, { data: existingPplp }] = await Promise.all([
        (supabase as any)
          .from('mint_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', 'LIGHT_ACTIVITY')
          .gte('created_at', twentyFourHoursAgo)
          .not('status', 'in', '("rejected","failed")')
          .limit(1),
        (supabase as any)
          .from('pplp_mint_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', 'LIGHT_ACTIVITY')
          .gte('created_at', twentyFourHoursAgo)
          .not('status', 'in', '("rejected","failed")')
          .limit(1),
      ]);

      if ((existingMint && existingMint.length > 0) || (existingPplp && existingPplp.length > 0)) {
        throw new Error('Bạn đã có yêu cầu mint LIGHT_ACTIVITY trong 24h qua. Vui lòng chờ.');
      }

      // 2. Run PPLP v2.5 VVU pipeline (live trust + SBT bonus + sybil)
      console.log('[MintRequest:auto] Running PPLP v2.5 adapter for LIGHT_ACTIVITY...');
      const v25 = await runV25MintAdapter({
        userId: user.id,
        actionType: 'LIGHT_ACTIVITY',
        walletAddress: input.userWalletAddress,
        evidence: {
          description: 'Auto-generated from platform light activities',
          contentLength: 50,
          isFirstTime: false,
        },
      });

      // 3. Hard reject from adapter
      if (v25.decision === 'REJECT') {
        const reason = v25.reasonCodes.join(', ') || 'Adapter rejected';
        console.error('[MintRequest:auto] v2.5 REJECT:', reason);
        throw new Error(`Yêu cầu bị từ chối: ${reason}`);
      }

      if (v25.funAmount <= 0) {
        throw new Error('💝 Bạn chưa có FUN để mint! Hãy tham gia thêm hoạt động trên nền tảng nhé 🌟');
      }

      // 4. Submit through pplp-mint-fun edge function (enforces trust gate + 20M cap + sybil block)
      console.log('[MintRequest:auto] Invoking pplp-mint-fun edge function...', {
        vvu: v25.vvu,
        funAmount: v25.funAmount,
        decision: v25.decision,
      });

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('pplp-mint-fun', {
        body: {
          recipient_address: input.userWalletAddress,
          action_type: 'LIGHT_ACTIVITY',
          amount: v25.funAmount,
          amount_wei: v25.funAmountAtomic,
          platform_id: 'fun_main',
          vvu_score: v25.vvu,
          engine_version: 'pplp-v2.5',
          metadata: {
            ...v25.metadata,
            decision: v25.decision,
            reason_codes: v25.reasonCodes,
            activity_summary: input.activitySummary,
          },
        },
      });

      if (edgeError) {
        console.error('[MintRequest:auto] Edge function error:', edgeError);
        throw new Error(edgeError.message || 'Mint edge function failed');
      }

      if (!edgeData?.id) {
        throw new Error(edgeData?.error || 'Edge function did not return request id');
      }

      console.log('[MintRequest:auto] Success! Request ID:', edgeData.id, 'status:', edgeData.status);

      // 5. Update last mint timestamp on profile
      await supabase
        .from('profiles')
        .update({ last_fun_mint_at: new Date().toISOString() })
        .eq('id', user.id);

      return { id: edgeData.id };

    } catch (err: any) {
      const errorMsg = err.message || 'Gửi yêu cầu tự động thất bại';
      console.error('[MintRequest:auto] Error:', errorMsg);
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
