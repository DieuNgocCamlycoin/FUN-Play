/**
 * sbt-issuance-engine — auto-evaluate & issue SBTs (delegates to DB RPC for consistency)
 *
 * POST { user_id?: uuid }                — single user (self by default)
 * POST { batch: true, limit?: number }   — admin only: scan top wallet-linked users
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));

    // === Batch mode (admin only) ===
    if (body.batch === true) {
      const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden — batch mode requires admin" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const limit = Math.min(2000, Math.max(1, Number(body.limit) || 500));
      const { data: candidates } = await admin
        .from('profiles')
        .select('id')
        .not('wallet_address', 'is', null)
        .neq('wallet_address', '')
        .limit(limit);

      let totalIssued = 0;
      let processed = 0;
      const errors: Array<{ user_id: string; error: string }> = [];

      for (const p of (candidates || [])) {
        const { data, error } = await admin.rpc('auto_issue_all_sbts', { _user_id: p.id });
        if (error) {
          errors.push({ user_id: p.id, error: error.message });
        } else {
          totalIssued += (data ?? 0);
          processed++;
        }
      }

      return new Response(JSON.stringify({
        mode: 'batch',
        processed,
        total_issued: totalIssued,
        errors_count: errors.length,
        sample_errors: errors.slice(0, 5),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === Single user mode ===
    const targetUserId = body.user_id || user.id;
    if (targetUserId !== user.id) {
      const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error } = await admin.rpc('auto_issue_all_sbts', { _user_id: targetUserId });
    if (error) throw error;

    // Return current SBTs after issuance
    const { data: sbts } = await admin.from('sbt_registry')
      .select('sbt_type, category, trust_weight, issued_at')
      .eq('user_id', targetUserId).eq('status', 'active')
      .order('issued_at', { ascending: false });

    const { data: trust } = await admin.from('trust_profile')
      .select('tc, tier, sybil_risk, permission_flags')
      .eq('user_id', targetUserId).maybeSingle();

    return new Response(JSON.stringify({
      user_id: targetUserId,
      newly_issued: data ?? 0,
      total_active_sbts: (sbts || []).length,
      sbts: sbts || [],
      trust,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("sbt-issuance-engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
