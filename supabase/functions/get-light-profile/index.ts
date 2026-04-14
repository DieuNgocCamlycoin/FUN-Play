/**
 * get-light-profile — GET /v1/users/{userId}/light-profile
 * Aggregates trust_level, total_light_score, total_fun_minted, streak, recent_actions count, pillar_summary
 * OpenAPI v1 — aligned with FUN_Backend_OpenAPI_Examples.json
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

    // Recent actions count
    const { count: recentActionsCount } = await supabaseAdmin
      .from("user_actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    // Pillar summary: per-pillar averages from pplp_validations for this user's actions
    const { data: allUserActions } = await supabaseAdmin
      .from("user_actions")
      .select("id")
      .eq("user_id", targetUserId)
      .in("status", ["validated", "minted"]);

    const actionIdSet = new Set((allUserActions || []).map((a: any) => a.id));

    const { data: validations } = await supabaseAdmin
      .from("pplp_validations")
      .select("serving_life, transparent_truth, healing_love, long_term_value, unity_over_separation, action_id")
      .eq("validation_status", "validated");

    const userValidations = (validations || []).filter((v: any) => actionIdSet.has(v.action_id));

    // Compute per-pillar averages
    const count = userValidations.length || 1;
    const pillarSummary = {
      serving_life_avg: round2(userValidations.reduce((s: number, v: any) => s + (v.serving_life || 0), 0) / count),
      transparent_truth_avg: round2(userValidations.reduce((s: number, v: any) => s + (v.transparent_truth || 0), 0) / count),
      healing_love_avg: round2(userValidations.reduce((s: number, v: any) => s + (v.healing_love || 0), 0) / count),
      long_term_value_avg: round2(userValidations.reduce((s: number, v: any) => s + (v.long_term_value || 0), 0) / count),
      unity_over_separation_avg: round2(userValidations.reduce((s: number, v: any) => s + (v.unity_over_separation || 0), 0) / count),
    };

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
      recent_actions: recentActionsCount ?? 0,
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

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
