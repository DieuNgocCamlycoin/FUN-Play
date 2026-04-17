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

async function snapshotUser(admin: any, userId: string, epochId: string) {
  const { data: did } = await admin.from('did_registry').select('*').eq('user_id', userId).maybeSingle();
  const { data: trust } = await admin.from('trust_profile').select('*').eq('user_id', userId).maybeSingle();
  const { data: sbts } = await admin.from('sbt_registry').select('token_id, sbt_type, category')
    .eq('user_id', userId).eq('status', 'active');

  if (!did || !trust) return { skipped: true };

  const flags = trust.permission_flags || {};
  const stateRoot = `${did.level}:${trust.tc}:${(sbts || []).length}:${epochId}`;

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

  return { snapshotted: true };
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
