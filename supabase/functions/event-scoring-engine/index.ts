/**
 * event-scoring-engine — Edge Function
 * Engine 1/4: Scores individual events into VVU
 * Uses Parameter Table v1.0
 * 
 * POST body: { event, context, quality, intention_signals, impact_signals, abuse_signals, ego_risk_signals }
 * Returns: { vvu, behavior, intention, impact, aaf, erp }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== PARAMETER TABLE v1.0 (inline for edge function) =====

const EVENT_BASE_VALUES: Record<string, number> = {
  daily_checkin: 0.2, profile_completed: 3, did_verification: 7, soulbound_mint: 10,
  content_created: 3, content_saved_used: 5, learning_completed: 2.5,
  referral_raw: 1, referral_activated: 10, transaction_real: 1.5,
  contribution_system: 8, gov_participation: 3, proposal_successful: 25,
  long_term_asset: 50, event_attended: 3,
};

const LEGACY_ACTION_MAP: Record<string, string> = {
  post_created: 'content_created', video_uploaded: 'content_created',
  livestream_hosted: 'content_created', course_published: 'content_created',
  comment_quality: 'content_created', video_watched_full: 'learning_completed',
  course_completed: 'learning_completed', like_given: 'daily_checkin',
  share_given: 'daily_checkin', bookmark_given: 'daily_checkin',
  mentor_session: 'contribution_system', help_newbie: 'contribution_system',
  answer_question: 'contribution_system', donation_made: 'transaction_real',
  reward_sent: 'transaction_real', pplp_accepted: 'profile_completed',
  wallet_linked: 'profile_completed', kyc_verified: 'did_verification',
  report_valid: 'contribution_system', mediation_joined: 'contribution_system',
  proposal_submitted: 'gov_participation', gov_vote_cast: 'gov_participation',
  bug_reported: 'contribution_system', pr_merged: 'contribution_system',
  staking_active: 'transaction_real',
};

function resolveBase(code: string): number {
  const mapped = LEGACY_ACTION_MAP[code] ?? code;
  return EVENT_BASE_VALUES[mapped] ?? 1.0;
}

// Trust Confidence — 5 levels
const TC_MAP: Record<string, number> = {
  new: 0.65, unknown: 0.65, standard: 0.9, basic: 0.9,
  trusted: 1.1, verified: 1.1, veteran: 1.3, strong: 1.3, core: 1.45,
};

// Quality: raw 0-1 → spec 0.3-1.8
function qualityToSpec(raw: number): number {
  if (raw < 0.3) return 0.3 + (raw / 0.3) * 0.3;
  if (raw < 0.6) return 0.8 + ((raw - 0.3) / 0.3) * 0.2;
  if (raw < 0.85) return 1.0 + ((raw - 0.6) / 0.25) * 0.3;
  return 1.3 + Math.min(1, (raw - 0.85) / 0.15) * 0.5;
}

// Ego Risk Penalty (pattern-based, replaces time-decay ERP)
function calcEgoRisk(s: { reward_claim_ratio?: number; shallow_content_ratio?: number; community_downvotes?: number; self_promotion_ratio?: number }): number {
  let erp = 1.0;
  const rcr = s.reward_claim_ratio ?? 0;
  if (rcr > 0.7) erp -= 0.1;
  if (rcr > 0.9) erp -= 0.1;
  const scr = s.shallow_content_ratio ?? 0;
  if (scr > 0.5) erp -= 0.15;
  if (scr > 0.8) erp -= 0.15;
  erp -= Math.min(0.2, (s.community_downvotes ?? 0) * 0.03);
  if ((s.self_promotion_ratio ?? 0) > 0.6) erp -= 0.1;
  return Math.max(0.5, Math.min(1.0, erp));
}

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
    const { event, context, quality, intention_signals, impact_signals, abuse_signals, ego_risk_signals } = body;

    if (!event || !event.action_code) {
      return new Response(JSON.stringify({ error: "Missing event data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== BEHAVIOR LAYER =====
    const base_value = resolveBase(event.action_code);

    const q = quality || { content_length: 100, content_originality: 0.5, completion_rate: 0.8, proof_verified: !!event.proof_link };
    const lengthQ = Math.min(1, (q.content_length || 100) / 200);
    const origQ = q.content_originality ?? 0.5;
    const compQ = q.completion_rate ?? 0.8;
    const proofQ = q.proof_verified ? 1.0 : 0.3;
    const rawQuality = lengthQ * 0.25 + origQ * 0.35 + compQ * 0.2 + proofQ * 0.2;
    const quality_score = qualityToSpec(rawQuality);

    const trust_weight = TC_MAP[(context?.user_trust_tier as string)] ?? 0.9;

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
    const im = Math.max(0.5, Math.min(3.0, baseIm * 3.0));

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

    // ===== EGO RISK PENALTY (pattern-based) =====
    const erp = calcEgoRisk(ego_risk_signals || {});

    // ===== VVU =====
    const vvu = Math.max(0, base_value * quality_score * trust_weight * context_bonus * iis * im * aaf * erp);

    // ===== STORE RESULT =====
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
