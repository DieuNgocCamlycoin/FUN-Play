/**
 * DIB Vault Aggregator — 7 reputation vaults per user.
 *
 * Identity + Trust Layer Spec v1.0 — DIB (Distributed Identity Bank)
 * Each vault is a normalized 0..1 score derived from on/off-chain signals.
 * Used as input to Trust Engine RF (reputation factor) and snapshot to
 * `identity_epoch_snapshot.metadata.dib`.
 */
import { supabase } from '@/integrations/supabase/client';

export type DIBVaultKey =
  | 'identity'      // KYC + DID level
  | 'contribution'  // PPLP events validated
  | 'validation'    // Peer attestations + reviews given
  | 'stake'         // FUN locked / claim locked
  | 'org'           // Org membership weight
  | 'history'       // Account age + consistency streak
  | 'reputation';   // Aggregate weighted public reputation

export interface DIBVault {
  key: DIBVaultKey;
  score: number;          // normalized 0..1
  weight: number;         // contribution weight to total
  raw: Record<string, number>;
}

export interface DIBSnapshot {
  user_id: string;
  total: number;          // 0..1 weighted average
  vaults: DIBVault[];
  computed_at: string;
}

const VAULT_WEIGHTS: Record<DIBVaultKey, number> = {
  identity: 0.20,
  contribution: 0.20,
  validation: 0.15,
  stake: 0.10,
  org: 0.10,
  history: 0.10,
  reputation: 0.15,
};

const DID_LEVEL_SCORE: Record<string, number> = { L0: 0.10, L1: 0.30, L2: 0.55, L3: 0.80, L4: 1.00 };

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Logarithmic normalize: maps [0..target] roughly to [0..1] with diminishing returns. */
function logNorm(value: number, target: number): number {
  if (value <= 0) return 0;
  return clamp01(Math.log1p(value) / Math.log1p(target));
}

export async function computeDIB(userId: string): Promise<DIBSnapshot> {
  // Sequentially-resolved queries to avoid TS deep instantiation in Promise.all generics
  const didRes: any = await supabase.from('did_registry').select('level, status, verified_org_badge, created_at').eq('user_id', userId).maybeSingle();
  const trustRes: any = await supabase.from('trust_profile').select('vs, bs, ss, os, hs, rf, sybil_risk').eq('user_id', userId).maybeSingle();
  const sbtCountRes: any = await supabase.from('sbt_registry').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active');
  const attestRes: any = await supabase.from('attestation_log').select('weight, ai_origin', { count: 'exact' }).eq('from_user_id', userId).eq('status', 'active');
  const profileRes: any = await supabase.from('profiles').select('created_at, consistency_days, total_camly_rewards').eq('id', userId).maybeSingle();
  const eventsRes: any = await supabase.from('identity_events').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  const orgRes: any = await supabase.from('org_members').select('role', { count: 'exact' }).eq('member_user_id', userId).eq('status', 'active');

  const didLevel = didRes.data?.level ?? 'L0';
  const verifiedOrg = !!didRes.data?.verified_org_badge;
  const sbtCount = sbtCountRes.count ?? 0;
  const attestGiven = attestRes.count ?? 0;
  const eventsCount = eventsRes.count ?? 0;
  const orgCount = orgRes.count ?? 0;
  const orgRoles = orgRes.data ?? [];
  const sybilRisk = Number(trustRes.data?.sybil_risk) || 0;

  const accountAgeDays = profileRes.data?.created_at
    ? (Date.now() - new Date(profileRes.data.created_at).getTime()) / 86_400_000
    : 0;
  const streak = Number(profileRes.data?.consistency_days) || 0;
  const totalRewards = Number(profileRes.data?.total_camly_rewards) || 0;

  // Vault: Identity — DID level + verified org bonus
  const identityScore = clamp01(
    (DID_LEVEL_SCORE[didLevel] ?? 0.10) + (verifiedOrg ? 0.10 : 0)
  );

  // Vault: Contribution — validated PPLP events (target 100)
  const contributionScore = logNorm(eventsCount, 100);

  // Vault: Validation — peer attestations given (target 20) + SBT held (target 5)
  const validationScore = clamp01(
    0.6 * logNorm(attestGiven, 20) + 0.4 * logNorm(sbtCount, 5)
  );

  // Vault: Stake — total earned rewards as proxy for skin-in-game (target 10000 FUN)
  const stakeScore = logNorm(totalRewards, 10_000);

  // Vault: Org — membership count + leadership bonus
  const hasLeadership = orgRoles.some((r: any) => r.role === 'owner' || r.role === 'admin');
  const orgScore = clamp01(logNorm(orgCount, 3) + (hasLeadership ? 0.20 : 0));

  // Vault: History — account age (target 365d) + consistency (target 90d)
  const historyScore = clamp01(
    0.5 * logNorm(accountAgeDays, 365) + 0.5 * logNorm(streak, 90)
  );

  // Vault: Reputation — weighted average of trust pillars (VS,BS,SS,OS,HS) penalized by sybil
  const t = trustRes.data;
  const pillarAvg = t
    ? (Number(t.vs) + Number(t.bs) + Number(t.ss) + Number(t.os) + Number(t.hs)) / 5
    : 0;
  const sybilPenalty = 1 - Math.min(0.5, sybilRisk / 200); // up to 50% penalty
  const reputationScore = clamp01(pillarAvg * sybilPenalty);

  const vaults: DIBVault[] = [
    { key: 'identity',     score: identityScore,     weight: VAULT_WEIGHTS.identity,     raw: { did_level_score: DID_LEVEL_SCORE[didLevel] ?? 0, verified_org: verifiedOrg ? 1 : 0 } },
    { key: 'contribution', score: contributionScore, weight: VAULT_WEIGHTS.contribution, raw: { events_count: eventsCount } },
    { key: 'validation',   score: validationScore,   weight: VAULT_WEIGHTS.validation,   raw: { attestations_given: attestGiven, sbt_count: sbtCount } },
    { key: 'stake',        score: stakeScore,        weight: VAULT_WEIGHTS.stake,        raw: { total_rewards: totalRewards } },
    { key: 'org',          score: orgScore,          weight: VAULT_WEIGHTS.org,          raw: { org_count: orgCount, has_leadership: hasLeadership ? 1 : 0 } },
    { key: 'history',      score: historyScore,      weight: VAULT_WEIGHTS.history,      raw: { account_age_days: Math.round(accountAgeDays), streak } },
    { key: 'reputation',   score: reputationScore,   weight: VAULT_WEIGHTS.reputation,   raw: { pillar_avg: Number(pillarAvg.toFixed(4)), sybil_risk: sybilRisk } },
  ];

  const total = clamp01(vaults.reduce((acc, v) => acc + v.score * v.weight, 0));

  return {
    user_id: userId,
    total: Number(total.toFixed(4)),
    vaults: vaults.map(v => ({ ...v, score: Number(v.score.toFixed(4)) })),
    computed_at: new Date().toISOString(),
  };
}

export const DIB_VAULT_LABELS: Record<DIBVaultKey, string> = {
  identity: 'Định danh',
  contribution: 'Đóng góp',
  validation: 'Xác thực',
  stake: 'Cam kết',
  org: 'Tổ chức',
  history: 'Lịch sử',
  reputation: 'Uy tín',
};
