/**
 * identity-trust-engine — Edge Function
 * Engine 2/4: Calculates Trust Coefficient, anti-sybil, soulbound trust
 * 
 * POST body: { user_id }
 * Returns: trust_tier, trust_coefficient, sybil_score, identity_signals
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const targetUserId = body.user_id || user.id;

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch profile
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, display_name, avatar_url, wallet_address, created_at, trust_level, consistency_days, banned, pplp_accepted_at')
      .eq('id', targetUserId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identity completeness
    const hasDisplayName = !!profile.display_name;
    const hasAvatar = !!profile.avatar_url;
    const hasWallet = !!profile.wallet_address;
    const hasPPLP = !!(profile as any).pplp_accepted_at;
    const identityScore = (hasDisplayName ? 0.2 : 0) + (hasAvatar ? 0.15 : 0) + (hasWallet ? 0.3 : 0) + (hasPPLP ? 0.35 : 0);

    // Account age
    const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const ageScore = Math.min(1, accountAgeDays / 365);

    // Anti-sybil: check IP collisions and wallet blacklist
    const { count: ipCollisions } = await adminSupabase
      .from('ip_tracking')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    const { data: blacklisted } = await adminSupabase
      .from('blacklisted_wallets')
      .select('id')
      .eq('user_id', targetUserId)
      .limit(1);

    const isBlacklisted = (blacklisted?.length || 0) > 0;
    const sybilScore = isBlacklisted ? 0.95 : Math.min(0.5, (ipCollisions || 0) * 0.05);

    // Behavioral trust: from features_user_day
    const { data: features } = await adminSupabase
      .from('features_user_day')
      .select('anti_farm_risk')
      .eq('user_id', targetUserId)
      .order('date', { ascending: false })
      .limit(30);

    const avgRisk = features && features.length > 0
      ? features.reduce((s: number, f: any) => s + (f.anti_farm_risk || 0), 0) / features.length
      : 0;

    // Community validation
    const { data: reviews } = await adminSupabase
      .from('community_reviews')
      .select('endorse_score, flag_score')
      .eq('reviewer_user_id', targetUserId);

    const endorsements = (reviews || []).filter((r: any) => (r.endorse_score || 0) > 0).length;
    const flags = (reviews || []).filter((r: any) => (r.flag_score || 0) > 0).length;

    // Trust Graph signal — incoming weighted vouches
    const { data: trustEdges } = await adminSupabase
      .from('trust_edges')
      .select('from_user_id, weight')
      .eq('to_user_id', targetUserId);
    const voucherIds = (trustEdges || []).map((e: any) => e.from_user_id);
    let voucherTcMap = new Map<string, number>();
    if (voucherIds.length > 0) {
      const { data: voucherProfiles } = await adminSupabase
        .from('trust_profile').select('user_id, tc').in('user_id', voucherIds);
      voucherTcMap = new Map((voucherProfiles || []).map((p: any) => [p.user_id, Number(p.tc) || 0.5]));
    }
    const incomingTrust = (trustEdges || []).reduce((s: number, e: any) => {
      return s + (Number(e.weight) || 0) * (voucherTcMap.get(e.from_user_id) ?? 0.5);
    }, 0);
    const networkTrustBonus = Math.min(0.15, incomingTrust * 0.05);

    // AI Trust signal — latest evaluation (cap ±0.10)
    const { data: aiEval } = await adminSupabase
      .from('ai_trust_evaluations')
      .select('tc_adjustment, fake_probability')
      .eq('user_id', targetUserId)
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const aiAdjustment = aiEval ? Math.max(-0.1, Math.min(0.1, Number(aiEval.tc_adjustment) || 0)) : 0;
    const aiFakeRisk = aiEval ? Number(aiEval.fake_probability) || 0 : 0;

    // Calculate Trust Coefficient (TC)
    let tc = 0.5; // base
    tc += identityScore * 0.2;
    tc += ageScore * 0.15;
    tc -= sybilScore * 0.3;
    tc -= avgRisk * 0.2;
    tc += Math.min(0.15, endorsements * 0.03);
    tc -= Math.min(0.2, flags * 0.05);
    tc += networkTrustBonus;
    tc += aiAdjustment;
    tc -= aiFakeRisk * 0.15;
    tc = Math.max(0, Math.min(1.2, tc));

    // Determine Trust Tier
    let trust_tier = 'new';
    if (profile.banned) trust_tier = 'new';
    else if (tc >= 0.9 && accountAgeDays >= 180) trust_tier = 'veteran';
    else if (tc >= 0.7 && accountAgeDays >= 90) trust_tier = 'trusted';
    else if (tc >= 0.5 && accountAgeDays >= 30) trust_tier = 'standard';

    // Update profile trust level
    await adminSupabase.from('profiles').update({
      trust_level: Math.round(tc * 10000) / 10000,
    }).eq('id', targetUserId);

    return new Response(JSON.stringify({
      user_id: targetUserId,
      trust_tier,
      trust_coefficient: Math.round(tc * 10000) / 10000,
      sybil_score: Math.round(sybilScore * 10000) / 10000,
      identity_completeness: Math.round(identityScore * 100) / 100,
      account_age_days: accountAgeDays,
      behavioral_risk: Math.round(avgRisk * 10000) / 10000,
      community_endorsements: endorsements,
      community_flags: flags,
      is_blacklisted: isBlacklisted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("identity-trust-engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
