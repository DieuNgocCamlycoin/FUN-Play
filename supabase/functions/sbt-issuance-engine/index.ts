/**
 * sbt-issuance-engine — auto-issue SBTs based on rules
 * POST { user_id?, sbt_type? }   — if sbt_type, evaluate that one; else evaluate all auto rules
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const targetUserId = body.user_id || user.id;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get DID
    const { data: did } = await admin.from('did_registry').select('*').eq('user_id', targetUserId).maybeSingle();
    if (!did) {
      return new Response(JSON.stringify({ error: "DID not found - run trust-engine-v1 first" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get profile + trust
    const { data: profile } = await admin.from('profiles').select('*').eq('id', targetUserId).single();
    const { data: trust } = await admin.from('trust_profile').select('*').eq('user_id', targetUserId).maybeSingle();

    // Get auto rules
    const { data: rules } = await admin.from('sbt_issuance_rules')
      .select('*').eq('issue_mode', 'auto').eq('is_active', true);

    // Get existing SBTs
    const { data: existing } = await admin.from('sbt_registry')
      .select('sbt_type').eq('user_id', targetUserId).eq('status', 'active');
    const existingTypes = new Set((existing || []).map((s: any) => s.sbt_type));

    const issued: string[] = [];
    const skipped: string[] = [];

    for (const rule of (rules || [])) {
      if (body.sbt_type && rule.sbt_type !== body.sbt_type) continue;
      if (existingTypes.has(rule.sbt_type)) { skipped.push(rule.sbt_type); continue; }

      const cond = rule.conditions || {};
      let qualifies = true;

      if (cond.min_did_level) {
        const order: Record<string, number> = { L0:0, L1:1, L2:2, L3:3, L4:4 };
        if ((order[did.level] ?? 0) < (order[cond.min_did_level] ?? 0)) qualifies = false;
      }
      if (cond.requires_wallet && !profile?.wallet_address) qualifies = false;
      if (cond.requires_pplp_accepted && !profile?.pplp_accepted_at) qualifies = false;
      if (cond.days_clean) {
        const ageDays = Math.floor((Date.now() - new Date(profile?.created_at).getTime()) / 86400000);
        if (ageDays < cond.days_clean) qualifies = false;
        if (profile?.banned) qualifies = false;
      }
      if (cond.max_sybil_risk != null && trust && trust.sybil_risk > cond.max_sybil_risk) qualifies = false;
      if (cond.min_streak && (profile?.consistency_days || 0) < cond.min_streak) qualifies = false;

      if (qualifies) {
        const { error: insErr } = await admin.from('sbt_registry').insert({
          did_id: did.did_id,
          user_id: targetUserId,
          category: rule.category,
          sbt_type: rule.sbt_type,
          issuer: 'system',
          status: 'active',
          trust_weight: rule.trust_weight,
          privacy_level: 'public',
          metadata: { rule_id: rule.id, auto_issued: true },
        });
        if (!insErr) {
          issued.push(rule.sbt_type);
          await admin.from('identity_events').insert({
            user_id: targetUserId,
            did_id: did.did_id,
            event_type: 'sbt_issued',
            event_ref: rule.sbt_type,
            tc_delta: Number(rule.trust_weight),
            payload: { sbt_type: rule.sbt_type, category: rule.category },
          });
        }
      } else {
        skipped.push(rule.sbt_type);
      }
    }

    return new Response(JSON.stringify({ issued, skipped, total_evaluated: rules?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("sbt-issuance-engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
