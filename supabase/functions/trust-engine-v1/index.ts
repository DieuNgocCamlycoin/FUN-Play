/**
 * trust-engine-v1 — Compute Trust Confidence per Identity+Trust Layer Spec v1.0
 * 
 * POST { user_id? }
 * Returns: full TrustComputation + writes to trust_profile
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEIGHTS = { vs: 0.30, bs: 0.25, ss: 0.15, os: 0.20, hs: 0.10 };
const DID_VS: Record<string, number> = { L0: 0.2, L1: 0.5, L2: 0.7, L3: 0.85, L4: 1.0 };

const r4 = (v: number) => Math.round(v * 10000) / 10000;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function tcToTier(tc: number): string {
  if (tc >= 1.25) return 'T4';
  if (tc >= 1.00) return 'T3';
  if (tc >= 0.80) return 'T2';
  if (tc >= 0.60) return 'T1';
  return 'T0';
}

async function computeForUser(admin: any, targetUserId: string) {
  const { data: profile } = await admin.from('profiles')
    .select('id, display_name, avatar_url, wallet_address, created_at, banned, pplp_accepted_at, consistency_days')
    .eq('id', targetUserId).single();
  if (!profile) return { error: 'User not found', user_id: targetUserId };
  return await runCompute(admin, targetUserId, profile);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));

    // === BATCH MODE (cron-only) ===
    // Triggered by pg_cron with anon key — recompute top N most-active users.
    if (body.cron === true && body.mode === 'batch_top_active') {
      const limit = Math.min(2000, Number(body.limit) || 1000);
      // Heuristic: most recently active in features_user_day (proxy for active users)
      const { data: activeRows } = await admin.from('features_user_day')
        .select('user_id')
        .gte('date', new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10))
        .limit(limit * 3);
      const uniqueIds = Array.from(new Set((activeRows || []).map((r: any) => r.user_id))).slice(0, limit);
      let okCount = 0;
      let errCount = 0;
      for (const uid of uniqueIds) {
        try {
          const r = await computeForUser(admin, uid);
          if ((r as any).error) errCount++; else okCount++;
        } catch { errCount++; }
      }
      return new Response(JSON.stringify({ batch: true, processed: uniqueIds.length, ok: okCount, errors: errCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SINGLE-USER MODE (authenticated) ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUserId = body.user_id || user.id;
    const { data: profile } = await admin.from('profiles')
      .select('id, display_name, avatar_url, wallet_address, created_at, banned, pplp_accepted_at, consistency_days')
      .eq('id', targetUserId).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await runCompute(admin, targetUserId, profile);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("trust-engine-v1 error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function runCompute(admin: any, targetUserId: string, profile: any) {
  try {

    // Fetch or create DID
    let { data: did } = await admin.from('did_registry')
      .select('*').eq('user_id', targetUserId).maybeSingle();
    if (!did) {
      const { data: newDid } = await admin.from('did_registry')
        .insert({ user_id: targetUserId, level: 'L0', status: 'pending', entity_type: 'human' })
        .select().single();
      did = newDid;
    }

    // Build signals
    const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
    const hasWallet = !!profile.wallet_address;
    const pplpAccepted = !!profile.pplp_accepted_at;

    // Promote DID level based on completeness
    let newLevel = did?.level || 'L0';
    if (hasWallet && pplpAccepted && accountAgeDays >= 30) newLevel = 'L2';
    else if (hasWallet || pplpAccepted) newLevel = 'L1';

    // Behavioral
    const { data: features } = await admin.from('features_user_day')
      .select('anti_farm_risk, count_posts, count_videos, count_comments')
      .eq('user_id', targetUserId)
      .order('date', { ascending: false }).limit(30);
    const avgFarmRisk = features && features.length > 0
      ? features.reduce((s: number, f: any) => s + (f.anti_farm_risk || 0), 0) / features.length : 0;
    const totalActions = (features || []).reduce((s: number, f: any) => 
      s + (f.count_posts||0) + (f.count_videos||0) + (f.count_comments||0), 0);

    // Social: attestations + community
    const { count: attestCount } = await admin.from('attestation_log')
      .select('id', { count: 'exact', head: true })
      .eq('to_user_id', targetUserId).eq('status', 'active');
    const { data: attestRows } = await admin.from('attestation_log')
      .select('weight').eq('to_user_id', targetUserId).eq('status', 'active');
    const attestWeightSum = (attestRows || []).reduce((s: number, r: any) => s + Number(r.weight || 0), 0);

    const { data: reviews } = await admin.from('community_reviews')
      .select('endorse_score, flag_score').eq('reviewer_user_id', targetUserId);
    const endorsements = (reviews || []).filter((r: any) => (r.endorse_score || 0) > 0).length;
    const flags = (reviews || []).filter((r: any) => (r.flag_score || 0) > 0).length;

    // On-chain proxies
    const walletAgeDays = hasWallet ? accountAgeDays : 0;
    const { count: sbtCount } = await admin.from('sbt_registry')
      .select('token_id', { count: 'exact', head: true })
      .eq('user_id', targetUserId).eq('status', 'active');
    const { count: txCount } = await admin.from('wallet_transactions')
      .select('id', { count: 'exact', head: true })
      .or(`from_address.eq.${profile.wallet_address || ''},to_address.eq.${profile.wallet_address || ''}`);

    // History
    const { count: ipCollisions } = await admin.from('ip_tracking')
      .select('id', { count: 'exact', head: true }).eq('user_id', targetUserId);
    const { data: blacklisted } = await admin.from('blacklisted_wallets')
      .select('id').eq('user_id', targetUserId).limit(1);
    const isBlacklisted = (blacklisted?.length || 0) > 0;

    // ===== Compute scores =====
    const vs = clamp(DID_VS[newLevel] * 0.6 + (hasWallet ? 0.10 : 0) + (pplpAccepted ? 0.10 : 0), 0, 1);
    const ageFactor = Math.min(1, accountAgeDays / 365);
    const streakFactor = Math.min(1, Math.log(1 + (profile.consistency_days || 0)) / Math.log(91));
    const validRatio = totalActions > 0 ? Math.min(1, totalActions / Math.max(1, totalActions + flags)) : 0.5;
    const farmClean = Math.max(0, 1 - avgFarmRisk);
    const bs = clamp(ageFactor * 0.3 + streakFactor * 0.25 + validRatio * 0.3 + farmClean * 0.15, 0, 1);

    const attestScore = Math.min(1, Math.sqrt(attestCount || 0) * 0.2 + attestWeightSum * 0.5);
    const ss = clamp(attestScore * 0.5 + Math.min(0.5, endorsements * 0.05) - Math.min(0.4, flags * 0.05), 0, 1);

    const os = hasWallet
      ? clamp(Math.min(1, walletAgeDays / 365) * 0.3 + Math.min(1, Math.log(1 + (txCount || 0)) / Math.log(101)) * 0.3 + Math.min(1, (sbtCount || 0) * 0.1) * 0.2 + 0.2, 0, 1)
      : 0.2;

    let hs = 1.0 - Math.min(0.2, (ipCollisions || 0) * 0.02);
    if (isBlacklisted) hs = 0;
    hs = clamp(hs, 0, 1);

    // RF
    let sybilRisk = Math.min(40, (ipCollisions || 0) * 5) + avgFarmRisk * 30;
    if (!hasWallet) sybilRisk += 10;
    if (walletAgeDays < 7 && hasWallet) sybilRisk += 10;
    if (isBlacklisted) sybilRisk = 100;
    sybilRisk = Math.round(clamp(sybilRisk, 0, 100));

    const fraudRisk = isBlacklisted ? 100 : Math.round(clamp(Math.min(30, flags * 5), 0, 100));
    const maxRisk = Math.max(sybilRisk, fraudRisk);
    let rf = 1.0;
    if (maxRisk >= 80) rf = 0.3;
    else if (maxRisk >= 60) rf = 0.5;
    else if (maxRisk >= 40) rf = 0.7;
    else if (maxRisk >= 20) rf = 0.9;

    const aggregate = vs * WEIGHTS.vs + bs * WEIGHTS.bs + ss * WEIGHTS.ss + os * WEIGHTS.os + hs * WEIGHTS.hs;
    const tcRaw = 0.30 + aggregate * 1.20;
    const tc = r4(clamp(tcRaw * rf, 0.30, 1.50));
    const tier = tcToTier(tc);

    // Permission flags
    const didOrder: Record<string, number> = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 };
    const dl = didOrder[newLevel] ?? 0;
    const safe = sybilRisk < 60;
    const permission_flags = {
      can_earn_basic: dl >= 1 && tc >= 0.6 && safe,
      can_receive_referral_rewards: dl >= 2 && tc >= 0.9 && safe,
      can_vote: dl >= 2 && tc >= 1.0 && safe,
      can_propose: dl >= 3 && tc >= 1.1 && safe,
      can_issue_sbt: dl >= 4 && tc >= 1.25 && safe,
      can_review_identity: dl >= 3 && tc >= 1.15 && safe,
      can_mint_full: tier !== 'T0' && tier !== 'T1' && safe,
    };

    // Update DID level if changed
    if (did && did.level !== newLevel) {
      await admin.from('did_registry').update({
        level: newLevel,
        status: newLevel === 'L0' ? 'pending' : (newLevel === 'L2' ? 'verified' : 'basic'),
      }).eq('did_id', did.did_id);
    }

    // Upsert trust_profile
    await admin.from('trust_profile').upsert({
      user_id: targetUserId,
      did_id: did?.did_id ?? null,
      tc, tier, vs: r4(vs), bs: r4(bs), ss: r4(ss), os: r4(os), hs: r4(hs), rf: r4(rf),
      sybil_risk: sybilRisk,
      fraud_risk: fraudRisk,
      cleanliness: r4(hs),
      permission_flags,
      last_computed_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return {
      user_id: targetUserId,
      did_id: did?.did_id,
      did_level: newLevel,
      tc, tier, vs: r4(vs), bs: r4(bs), ss: r4(ss), os: r4(os), hs: r4(hs), rf: r4(rf),
      sybil_risk: sybilRisk,
      fraud_risk: fraudRisk,
      permission_flags,
      computed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("runCompute error:", error);
    return { error: error instanceof Error ? error.message : "Unknown", user_id: targetUserId };
  }
}
