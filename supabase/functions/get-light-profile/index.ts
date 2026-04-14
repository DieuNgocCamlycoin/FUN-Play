/**
 * get-light-profile — GET /v1/users/{userId}/light-profile
 * Aggregates trust_level, total_light_score, total_fun_minted, streak, recent_actions, pillar_summary
 * OpenAPI v1
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional: allow querying another user's public profile
    let body: any = {};
    try { body = await req.json(); } catch { /* no body = self */ }
    const targetUserId = body.user_id || user.id;

    // Profile data
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("trust_level, total_light_score, consistency_days, created_at")
      .eq("id", targetUserId)
      .single();

    // Total FUN minted
    const { data: mintAgg } = await supabaseAdmin
      .from("mint_records")
      .select("mint_amount_user")
      .eq("user_id", targetUserId)
      .eq("status", "minted");

    const totalFunMinted = (mintAgg || []).reduce((sum: number, r: any) => sum + (r.mint_amount_user || 0), 0);

    // Recent actions (last 10)
    const { data: recentActions } = await supabaseAdmin
      .from("user_actions")
      .select("id, title, status, submitted_at, action_types(code, pillar_group)")
      .eq("user_id", targetUserId)
      .order("submitted_at", { ascending: false })
      .limit(10);

    // Pillar summary: avg PPLP scores per pillar_group
    const { data: validations } = await supabaseAdmin
      .from("pplp_validations")
      .select("serving_life, transparent_truth, healing_love, long_term_value, unity_over_separation, action_id")
      .eq("validation_status", "validated");

    // Filter to this user's actions
    const userActionIds = (recentActions || []).map((a: any) => a.id);
    const { data: allUserActions } = await supabaseAdmin
      .from("user_actions")
      .select("id, action_types(pillar_group)")
      .eq("user_id", targetUserId)
      .in("status", ["validated", "minted"]);

    const actionIdSet = new Set((allUserActions || []).map((a: any) => a.id));
    const actionPillarMap = new Map((allUserActions || []).map((a: any) => [a.id, a.action_types?.pillar_group]));

    const userValidations = (validations || []).filter((v: any) => actionIdSet.has(v.action_id));

    // Group by pillar
    const pillarSummary: Record<string, { count: number; avg_light_score: number }> = {};
    for (const v of userValidations) {
      const pillar = actionPillarMap.get(v.action_id) || "unknown";
      if (!pillarSummary[pillar]) pillarSummary[pillar] = { count: 0, avg_light_score: 0 };
      pillarSummary[pillar].count++;
      const ls = (v.serving_life * v.transparent_truth * v.healing_love * v.long_term_value * v.unity_over_separation) / 10000;
      pillarSummary[pillar].avg_light_score += ls;
    }
    for (const key of Object.keys(pillarSummary)) {
      if (pillarSummary[key].count > 0) {
        pillarSummary[key].avg_light_score = Math.round((pillarSummary[key].avg_light_score / pillarSummary[key].count) * 100) / 100;
      }
    }

    // Streak days
    const { data: checkins } = await supabaseAdmin
      .from("daily_checkins")
      .select("streak_count")
      .eq("user_id", targetUserId)
      .order("checkin_date", { ascending: false })
      .limit(1);

    const streakDays = checkins?.[0]?.streak_count || profile?.consistency_days || 0;

    return new Response(JSON.stringify({
      user_id: targetUserId,
      trust_level: profile?.trust_level ?? 1.0,
      total_light_score: profile?.total_light_score ?? 0,
      total_fun_minted: Math.round(totalFunMinted * 100) / 100,
      streak_days: streakDays,
      member_since: profile?.created_at || null,
      recent_actions: (recentActions || []).map((a: any) => ({
        action_id: a.id,
        title: a.title,
        status: a.status,
        action_type: a.action_types?.code || null,
        pillar_group: a.action_types?.pillar_group || null,
        submitted_at: a.submitted_at,
      })),
      pillar_summary: pillarSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-light-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
