/**
 * identity-epoch-snapshot — snapshot identity+trust state per epoch
 * POST { user_id?, epoch_id? }   — admin can snapshot all if user_id omitted (cron)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function currentEpoch(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Inline DIB vault aggregator (mirrors src/lib/identity/dib-vault.ts).
// Edge functions can't import src/, so logic is duplicated server-side.
const DIB_WEIGHTS = { identity: 0.20, contribution: 0.20, validation: 0.15, stake: 0.10, org: 0.10, history: 0.10, reputation: 0.15 };
const DID_LEVEL_SCORE: Record<string, number> = { L0: 0.10, L1: 0.30, L2: 0.55, L3: 0.80, L4: 1.00 };
const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const logNorm = (v: number, t: number) => v <= 0 ? 0 : clamp01(Math.log1p(v) / Math.log1p(t));

async function computeDIBServer(admin: any, userId: string, did: any, trust: any, sbtCount: number) {
  const [attestRes, profileRes, eventsRes, orgRes] = await Promise.all([
    admin.from('attestation_log').select('id', { count: 'exact', head: true }).eq('from_user_id', userId).eq('status', 'active'),
    admin.from('profiles').select('created_at, consistency_days, total_camly_rewards').eq('id', userId).maybeSingle(),
    admin.from('identity_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('org_members').select('role', { count: 'exact' }).eq('member_user_id', userId).eq('status', 'active'),
  ]);
  const attestGiven = attestRes.count ?? 0;
  const eventsCount = eventsRes.count ?? 0;
  const orgCount = orgRes.count ?? 0;
  const orgRoles = orgRes.data ?? [];
  const sybilRisk = Number(trust.sybil_risk) || 0;
  const accountAgeDays = profileRes.data?.created_at ? (Date.now() - new Date(profileRes.data.created_at).getTime()) / 86_400_000 : 0;
  const streak = Number(profileRes.data?.consistency_days) || 0;
  const totalRewards = Number(profileRes.data?.total_camly_rewards) || 0;

  const identity = clamp01((DID_LEVEL_SCORE[did.level] ?? 0.10) + (did.verified_org_badge ? 0.10 : 0));
  const contribution = logNorm(eventsCount, 100);
  const validation = clamp01(0.6 * logNorm(attestGiven, 20) + 0.4 * logNorm(sbtCount, 5));
  const stake = logNorm(totalRewards, 10_000);
  const hasLead = orgRoles.some((r: any) => r.role === 'owner' || r.role === 'admin');
  const org = clamp01(logNorm(orgCount, 3) + (hasLead ? 0.20 : 0));
  const history = clamp01(0.5 * logNorm(accountAgeDays, 365) + 0.5 * logNorm(streak, 90));
  const pillarAvg = (Number(trust.vs) + Number(trust.bs) + Number(trust.ss) + Number(trust.os) + Number(trust.hs)) / 5;
  const reputation = clamp01(pillarAvg * (1 - Math.min(0.5, sybilRisk / 200)));

  const total = clamp01(
    identity * DIB_WEIGHTS.identity + contribution * DIB_WEIGHTS.contribution + validation * DIB_WEIGHTS.validation +
    stake * DIB_WEIGHTS.stake + org * DIB_WEIGHTS.org + history * DIB_WEIGHTS.history + reputation * DIB_WEIGHTS.reputation
  );

  return {
    total: Number(total.toFixed(4)),
    vaults: {
      identity: Number(identity.toFixed(4)), contribution: Number(contribution.toFixed(4)),
      validation: Number(validation.toFixed(4)), stake: Number(stake.toFixed(4)),
      org: Number(org.toFixed(4)), history: Number(history.toFixed(4)), reputation: Number(reputation.toFixed(4)),
    },
  };
}

async function snapshotUser(admin: any, userId: string, epochId: string) {
  const { data: did } = await admin.from('did_registry').select('*').eq('user_id', userId).maybeSingle();
  const { data: trust } = await admin.from('trust_profile').select('*').eq('user_id', userId).maybeSingle();
  const { data: sbts } = await admin.from('sbt_registry').select('token_id, sbt_type, category')
    .eq('user_id', userId).eq('status', 'active');

  if (!did || !trust) return { skipped: true };

  const flags = trust.permission_flags || {};
  const sbtCount = (sbts || []).length;
  const dib = await computeDIBServer(admin, userId, did, trust, sbtCount);
  const stateRoot = `${did.level}:${trust.tc}:${sbtCount}:${dib.total}:${epochId}`;

  await admin.from('identity_epoch_snapshot').upsert({
    user_id: userId,
    did_id: did.did_id,
    epoch_id: epochId,
    did_level: did.level,
    tc: trust.tc,
    tier: trust.tier,
    sybil_risk: trust.sybil_risk,
    active_sbts: sbts || [],
    governance_eligible: !!flags.can_vote,
    mint_eligible: !!flags.can_mint_full,
    state_root_hash: stateRoot,
  }, { onConflict: 'user_id,epoch_id' });

  return { snapshotted: true, dib };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const epochId = body.epoch_id || currentEpoch();
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (body.user_id) {
      const r = await snapshotUser(admin, body.user_id, epochId);
      return new Response(JSON.stringify({ epoch_id: epochId, ...r }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Bulk: only admin
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      const r = await snapshotUser(admin, user.id, epochId);
      return new Response(JSON.stringify({ epoch_id: epochId, ...r }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin batch
    const { data: profiles } = await admin.from('trust_profile').select('user_id').limit(5000);
    let count = 0;
    for (const p of (profiles || [])) {
      const r = await snapshotUser(admin, p.user_id, epochId);
      if (r.snapshotted) count++;
    }

    return new Response(JSON.stringify({ epoch_id: epochId, snapshotted_count: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("identity-epoch-snapshot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
