/**
 * Auto Mint FUN Hook
 * Listens for camly-reward events and automatically creates FUN_PLAY mint requests
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMintRequest } from '@/hooks/useFunMoneyMintRequest';
import type { PillarScores, UnitySignals } from '@/lib/fun-money/pplp-engine';

// ===== TYPES =====

interface CamlyRewardDetail {
  type: string;
  amount: number;
  autoApproved?: boolean;
  videoId?: string;
}

// Mapping from CAMLY reward type to FUN_PLAY action type
const CAMLY_TO_FUN_ACTION: Record<string, string> = {
  'VIEW': 'WATCH_VIDEO',
  'LIKE': 'LIKE_VIDEO',
  'COMMENT': 'COMMENT',
  'SHARE': 'SHARE',
  'UPLOAD': 'UPLOAD_VIDEO',
  'SHORT_VIDEO_UPLOAD': 'UPLOAD_VIDEO',
  'LONG_VIDEO_UPLOAD': 'UPLOAD_VIDEO',
  'FIRST_UPLOAD': 'UPLOAD_VIDEO',
  'SIGNUP': 'SIGNUP',
  'WALLET_CONNECT': 'WALLET_CONNECT',
  'CREATE_POST': 'CREATE_POST',
};

const MIN_LIGHT_SCORE = 60;
const COOLDOWN_MS = 60_000; // 1 minute per action type

// ===== HOOK =====

export function useAutoMintFun(userId: string | undefined) {
  const { submitRequest } = useMintRequest();
  const cooldownMap = useRef<Map<string, number>>(new Map());
  const processingRef = useRef(false);

  const handleCamlyReward = useCallback(async (event: Event) => {
    if (!userId || processingRef.current) return;

    const detail = (event as CustomEvent<CamlyRewardDetail>).detail;
    const funAction = CAMLY_TO_FUN_ACTION[detail.type];
    if (!funAction) return; // Not a mappable action (e.g. SIGNUP, WALLET_CONNECT)

    // Cooldown check
    const cooldownKey = `${funAction}-${detail.videoId || 'none'}`;
    const lastMint = cooldownMap.current.get(cooldownKey) || 0;
    if (Date.now() - lastMint < COOLDOWN_MS) return;

    processingRef.current = true;

    try {
      // Fetch profile data for scoring
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('light_score, wallet_address, auto_mint_fun_enabled, suspicious_score, avatar_verified, created_at')
        .eq('id', userId)
        .single();

      if (profileError || !profile) return;

      // Check if auto-mint is enabled
      if (profile.auto_mint_fun_enabled === false) return;

      // Check wallet
      if (!profile.wallet_address) return;

      // Check light score
      if ((profile.light_score || 0) < MIN_LIGHT_SCORE) return;

      // Build pillar scores (simplified from profile data)
      const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const isVerified = profile.avatar_verified || false;

      const pillars: PillarScores = {
        S: Math.min(100, 50),
        T: Math.min(100, (isVerified ? 30 : 0) + Math.min(accountAgeDays, 365) / 365 * 40 + 30),
        H: 50,
        C: Math.min(100, 40),
        U: Math.min(100, 30),
      };

      const unitySignals: Partial<UnitySignals> = {
        collaboration: false,
        beneficiaryConfirmed: false,
        communityEndorsement: false,
        bridgeValue: false,
      };

      // Submit mint request
      const result = await submitRequest({
        platformId: 'FUN_PLAY',
        actionType: funAction,
        userWalletAddress: profile.wallet_address,
        evidence: {
          type: funAction,
          description: `Auto-mint from ${detail.type} action`,
          data: JSON.stringify({
            camlyAmount: detail.amount,
            videoId: detail.videoId,
            timestamp: new Date().toISOString(),
          }),
        },
        pillarScores: pillars,
        unitySignals,
        antiSybilScore: 1 - (profile.suspicious_score || 0) / 10,
        qualityMultiplier: 1.0,
        impactMultiplier: 1.0,
      });

      if (result) {
        cooldownMap.current.set(cooldownKey, Date.now());
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('fun-mint-requested', {
          detail: {
            actionType: funAction,
            requestId: result.id,
            amount: result.scoringResult.calculatedAmountFormatted,
          },
        }));

        console.log(`[AutoMintFUN] Created mint request for ${funAction}: ${result.scoringResult.calculatedAmountFormatted}`);
      }
    } catch (err) {
      console.error('[AutoMintFUN] Error:', err);
    } finally {
      processingRef.current = false;
    }
  }, [userId, submitRequest]);

  useEffect(() => {
    if (!userId) return;

    window.addEventListener('camly-reward', handleCamlyReward);
    return () => window.removeEventListener('camly-reward', handleCamlyReward);
  }, [userId, handleCamlyReward]);
}
