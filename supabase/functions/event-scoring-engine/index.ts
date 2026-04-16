/**
 * event-scoring-engine — Edge Function
 * Engine 1/4: Scores individual events into VVU
 * 
 * POST body: { event, context, quality, intention, impact, abuse }
 * Returns: { vvu, behavior, intention, impact, aaf, erp }
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
    const { event, context, quality, intention_signals, impact_signals, abuse_signals, event_age_days = 0 } = body;

    if (!event || !event.action_code) {
      return new Response(JSON.stringify({ error: "Missing event data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== BASE VALUES =====
    const BASE_VALUES: Record<string, number> = {
      post_created: 3.0, video_uploaded: 5.0, livestream_hosted: 6.0,
      course_published: 8.0, comment_quality: 1.5, video_watched_full: 1.0,
      course_completed: 4.0, like_given: 0.3, share_given: 0.8,
      bookmark_given: 0.5, mentor_session: 6.0, help_newbie: 4.0,
      answer_question: 2.5, donation_made: 5.0, reward_sent: 3.0,
      profile_completed: 2.0, pplp_accepted: 3.0, wallet_linked: 2.0,
      report_valid: 2.0, mediation_joined: 3.0, proposal_submitted: 4.0,
      gov_vote_cast: 2.0, bug_reported: 3.0, pr_merged: 6.0,
      daily_checkin: 1.0, event_attended: 3.0, staking_active: 2.0,
    };

    // ===== BEHAVIOR LAYER =====
    const base_value = BASE_VALUES[event.action_code] ?? 1.0;
    
    const q = quality || { content_length: 100, content_originality: 0.5, response_time_minutes: 5, completion_rate: 0.8, proof_verified: !!event.proof_link };
    const lengthQ = Math.min(1, (q.content_length || 100) / 200);
    const origQ = q.content_originality ?? 0.5;
    const compQ = q.completion_rate ?? 0.8;
    const proofQ = q.proof_verified ? 1.0 : 0.3;
    const quality_score = lengthQ * 0.25 + origQ * 0.35 + compQ * 0.2 + proofQ * 0.2;

    const TRUST_WEIGHTS = { new: 0.6, standard: 0.85, trusted: 1.0, veteran: 1.15 };
    const trust_weight = TRUST_WEIGHTS[(context?.user_trust_tier as keyof typeof TRUST_WEIGHTS)] ?? 0.85;
    
    let context_bonus = 1.0;
    if (context?.is_first_time) context_bonus += 0.1;

    // ===== INTENTION LAYER =====
    const is = intention_signals || { active_streak_days: 1, total_actions_30d: 1, useful_actions_30d: 1, farm_pattern_actions_30d: 0, manipulation_flags: 0, value_before_reward_ratio: 0.5, self_vs_network_ratio: 0.3, consistency_variance: 0.3 };
    
    const streakFactor = Math.min(1, Math.log(1 + (is.active_streak_days || 1)) / Math.log(91));
    const variancePenalty = Math.max(0, 1 - (is.consistency_variance || 0.3));
    const consistency_signal = streakFactor * 0.6 + variancePenalty * 0.4;
    
    const totalActions = Math.max(1, is.total_actions_30d || 1);
    const useful_ratio = Math.min(1, (is.useful_actions_30d || 0) / totalActions);
    const farmRatio = (is.farm_pattern_actions_30d || 0) / totalActions;
    const manipulation_penalty = Math.exp(-(is.manipulation_flags || 0) * 2);
    const value_first_bonus = (is.value_before_reward_ratio || 0.5) * 0.5;
    const network_orientation = is.self_vs_network_ratio || 0.3;

    let iis = consistency_signal * 0.25 + useful_ratio * 0.25 + manipulation_penalty * 0.2 + network_orientation * 0.15 + value_first_bonus * 0.15;
    if (farmRatio > 0.3) iis *= Math.max(0.1, 1 - farmRatio);
    if (consistency_signal > 0.8 && useful_ratio > 0.7 && manipulation_penalty > 0.9) {
      iis = Math.min(1.5, iis * 1.5);
    }
    iis = Math.max(0, Math.min(1.5, iis));

    // ===== IMPACT LAYER =====
    const imp = impact_signals || {};
    const activation_help = Math.min(1, Math.sqrt(imp.helped_newbie_activate || 0) * 0.5);
    const trust_amp = Math.min(1, Math.sqrt(imp.helped_others_trust_increase || 0) * 0.4);
    const contentImpact = (imp.content_saved_count || 0) + (imp.content_reused_count || 0) * 2;
    const content_ripple = Math.min(1, Math.log(1 + contentImpact) / 5);
    const refTotal = Math.max(1, imp.referral_total_count || 1);
    const referral_quality = ((imp.referral_active_count || 0) / refTotal) * Math.min(1, Math.sqrt(imp.referral_active_count || 0) * 0.3);
    const ecosystem_health = ((imp.proposal_improvement_score || 0) + (imp.retention_contribution || 0) + (imp.community_quality_contribution || 0) + (imp.knowledge_contribution || 0) + (imp.healthy_liquidity_contribution || 0)) * 0.2;

    const baseIm = activation_help * 0.25 + trust_amp * 0.2 + content_ripple * 0.2 + referral_quality * 0.15 + ecosystem_health * 0.2;
    const im = Math.min(3.0, baseIm * 3.0);

    // ===== ANTI-ABUSE =====
    const ab = abuse_signals || { fraud_score: 0, sybil_probability: 0, velocity_violation: false, duplicate_content: false, community_reports: 0, ip_collision_score: 0 };
    let aaf = 1.0;
    aaf *= Math.exp(-(ab.fraud_score || 0) * 4);
    aaf *= Math.max(0.05, 1 - (ab.sybil_probability || 0) * 1.5);
    if (ab.velocity_violation) aaf *= 0.3;
    if (ab.duplicate_content) aaf *= 0.2;
    aaf *= Math.max(0.1, 1 - (ab.community_reports || 0) * 0.15);
    aaf *= Math.max(0.3, 1 - (ab.ip_collision_score || 0) * 0.5);
    aaf = Math.max(0, Math.min(1, aaf));

    // ===== ERP =====
    const ageDays = event_age_days || 0;
    let erp = 1.0;
    if (ageDays > 7 && ageDays < 90) erp = 1.0 - (ageDays - 7) * (0.5 / 83);
    else if (ageDays >= 90) erp = 0.5;

    // ===== VVU =====
    const vvu = Math.max(0, base_value * quality_score * trust_weight * context_bonus * iis * im * aaf * erp);

    // ===== STORE RESULT =====
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log to user_actions if action_id provided
    if (event.action_id) {
      await adminSupabase.from('user_actions').update({
        vvu_score: Math.round(vvu * 10000) / 10000,
        iis_score: Math.round(iis * 10000) / 10000,
        impact_multiplier: Math.round(im * 10000) / 10000,
        anti_abuse_factor: Math.round(aaf * 10000) / 10000,
      }).eq('id', event.action_id);
    }

    return new Response(JSON.stringify({
      vvu: Math.round(vvu * 10000) / 10000,
      behavior: { base_value, quality_score: Math.round(quality_score * 10000) / 10000, trust_weight, context_bonus },
      intention: { iis: Math.round(iis * 10000) / 10000, consistency_signal: Math.round(consistency_signal * 10000) / 10000, useful_ratio, manipulation_penalty },
      impact: { im: Math.round(im * 10000) / 10000, activation_help, trust_amp, content_ripple },
      aaf: Math.round(aaf * 10000) / 10000,
      erp: Math.round(erp * 10000) / 10000,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("event-scoring-engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
