/**
 * Auto Mint FUN Hook — PPLP v2.5
 * Listens for camly-reward events and creates FUN_PLAY mint requests
 * using the v2.5 VVU pipeline (live trust + SBT bonus + sybil penalty).
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runV25MintAdapter } from '@/lib/fun-money/pplp-v25-adapter';
import { createActionHash, createEvidenceHash } from '@/lib/fun-money/web3-config';

// ===== TYPES =====

interface CamlyRewardDetail {
  type: string;
  amount: number;
  autoApproved?: boolean;
  videoId?: string;
}

// Mapping from CAMLY reward type to FUN_PLAY action type
const CAMLY_TO_FUN_ACTION: Record<string, string> = {
  VIEW: 'WATCH_VIDEO',
  LIKE: 'LIKE_VIDEO',
  COMMENT: 'COMMENT',
  SHARE: 'SHARE',
  UPLOAD: 'UPLOAD_VIDEO',
  SHORT_VIDEO_UPLOAD: 'UPLOAD_VIDEO',
  LONG_VIDEO_UPLOAD: 'UPLOAD_VIDEO',
  FIRST_UPLOAD: 'UPLOAD_VIDEO',
  SIGNUP: 'SIGNUP',
  WALLET_CONNECT: 'WALLET_CONNECT',
  CREATE_POST: 'CREATE_POST',
};

const MIN_LIGHT_SCORE = 60;
const COOLDOWN_MS = 60_000; // 1 minute per action type

// ===== HOOK =====

export function useAutoMintFun(userId: string | undefined) {
  const cooldownMap = useRef<Map<string, number>>(new Map());
  const processingRef = useRef(false);

  const handleCamlyReward = useCallback(
    async (event: Event) => {
      if (!userId || processingRef.current) return;

      const detail = (event as CustomEvent<CamlyRewardDetail>).detail;
      const funAction = CAMLY_TO_FUN_ACTION[detail.type];
      if (!funAction) return;

      const cooldownKey = `${funAction}-${detail.videoId || 'none'}`;
      const lastMint = cooldownMap.current.get(cooldownKey) || 0;
      if (Date.now() - lastMint < COOLDOWN_MS) return;

      processingRef.current = true;

      try {
        // 1) Profile gates
        const { data: profile } = await supabase
          .from('profiles')
          .select('light_score, wallet_address, auto_mint_fun_enabled')
          .eq('id', userId)
          .single();
        if (!profile) return;
        if (profile.auto_mint_fun_enabled === false) return;
        if (!profile.wallet_address) return;
        if ((profile.light_score || 0) < MIN_LIGHT_SCORE) return;

        // 2) Run v2.5 pipeline (live TC + SBT + sybil)
        const result = await runV25MintAdapter({
          userId,
          actionType: funAction,
          walletAddress: profile.wallet_address,
          evidence: { videoId: detail.videoId, isFirstTime: detail.type === 'FIRST_UPLOAD' },
        });

        if (result.decision === 'REJECT') {
          console.log('[AutoMintFUN/v2.5] Rejected:', result.reasonCodes);
          return;
        }

        // 3) Submit via edge function (enforces Trust+Sybil+epoch gates)
        const actionHash = createActionHash(funAction);
        const evidenceHash = createEvidenceHash({
          actionType: funAction,
          timestamp: Math.floor(Date.now() / 1000),
          pillars: {},
          metadata: { camly: detail, vvu: result.vvu, ...result.metadata },
        });

        const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
          'pplp-mint-fun',
          {
            body: {
              recipient_address: profile.wallet_address,
              action_type: funAction,
              amount: result.funAmount,
              amount_wei: result.funAmountAtomic,
              action_hash: actionHash,
              evidence_hash: evidenceHash,
              platform_id: 'fun_main',
              vvu_score: result.vvu,
              engine_version: 'pplp-v2.5',
              metadata: {
                engine: 'pplp-v2.5',
                vvu: result.vvu,
                components: result.metadata,
                source: 'auto-mint',
                camly_reward: detail,
                decision: result.decision,
              },
            },
          },
        );

        if (invokeError) {
          console.error('[AutoMintFUN/v2.5] Edge invoke error:', invokeError);
          return;
        }

        const mintRequest = invokeData?.request;

        cooldownMap.current.set(cooldownKey, Date.now());

        window.dispatchEvent(
          new CustomEvent('fun-mint-requested', {
            detail: {
              actionType: funAction,
              requestId: mintRequest?.id,
              amount: result.funAmount,
              vvu: result.vvu,
              engine: 'v2.5',
            },
          }),
        );

        console.log(
          `[AutoMintFUN/v2.5] ${funAction} → VVU ${result.vvu.toFixed(3)} → ${result.funAmount} FUN ` +
            `(TC ${result.metadata.live_tc?.toFixed(2) ?? 'n/a'}, SBT +${(result.metadata.sbt_bonus ?? 0).toFixed(2)})`,
        );
      } catch (err) {
        console.error('[AutoMintFUN/v2.5] Error:', err);
      } finally {
        processingRef.current = false;
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    window.addEventListener('camly-reward', handleCamlyReward);
    return () => window.removeEventListener('camly-reward', handleCamlyReward);
  }, [userId, handleCamlyReward]);
}
