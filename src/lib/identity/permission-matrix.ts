/**
 * Permission Matrix — what each tier can do
 */
import type { TrustTier } from './trust-tier';

export interface ActivationRequirement {
  action: string;
  min_did_level: 'L0'|'L1'|'L2'|'L3'|'L4';
  min_tc: number;
  sbt_required: boolean;
  description: string;
}

export const ACTIVATION_MATRIX: ActivationRequirement[] = [
  { action: 'basic_access',     min_did_level: 'L0', min_tc: 0.30, sbt_required: false, description: 'Trải nghiệm cơ bản' },
  { action: 'earn_basic',       min_did_level: 'L1', min_tc: 0.80, sbt_required: false, description: 'Nhận thưởng cơ bản' },
  { action: 'referral_reward',  min_did_level: 'L2', min_tc: 0.90, sbt_required: false, description: 'Nhận thưởng giới thiệu' },
  { action: 'mint_full',        min_did_level: 'L2', min_tc: 0.80, sbt_required: false, description: 'Mint FUN đầy đủ' },
  { action: 'governance_vote',  min_did_level: 'L2', min_tc: 1.00, sbt_required: true,  description: 'Bỏ phiếu governance' },
  { action: 'proposal_submit',  min_did_level: 'L3', min_tc: 1.10, sbt_required: true,  description: 'Đề xuất proposal' },
  { action: 'reviewer',         min_did_level: 'L3', min_tc: 1.15, sbt_required: true,  description: 'Reviewer / Curator' },
  { action: 'sbt_issuer',       min_did_level: 'L4', min_tc: 1.25, sbt_required: true,  description: 'Cấp phát SBT' },
];

export function checkPermission(
  action: string,
  user: { did_level: string; tc: number; has_sbt: boolean; sybil_risk: number }
): { allowed: boolean; reason?: string } {
  const req = ACTIVATION_MATRIX.find(r => r.action === action);
  if (!req) return { allowed: false, reason: `Unknown action: ${action}` };
  
  if (user.sybil_risk >= 60) return { allowed: false, reason: 'Sybil risk quá cao' };
  
  const order = { L0:0, L1:1, L2:2, L3:3, L4:4 } as const;
  const userLvl = order[user.did_level as keyof typeof order] ?? 0;
  const reqLvl = order[req.min_did_level];
  
  if (userLvl < reqLvl) return { allowed: false, reason: `Cần DID ${req.min_did_level}` };
  if (user.tc < req.min_tc) return { allowed: false, reason: `Cần TC ≥ ${req.min_tc}` };
  if (req.sbt_required && !user.has_sbt) return { allowed: false, reason: 'Cần ít nhất 1 SBT' };
  
  return { allowed: true };
}
