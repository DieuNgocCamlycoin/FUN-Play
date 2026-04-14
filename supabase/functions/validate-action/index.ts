/**
 * validate-action — PPLP 3-Layer Validation Engine
 * AI (60%) + Community (20%) + System Trust (20%)
 * 
 * CTO Diagram v13Apr2026: Truth Validation Engine
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation weights
const AI_WEIGHT = 0.6;
const COMMUNITY_WEIGHT = 0.2;
const SYSTEM_TRUST_WEIGHT = 0.2;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action_id } = await req.json();
    if (!action_id) {
      return new Response(JSON.stringify({ error: "action_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get action with proofs
    const { data: action } = await supabaseAdmin
      .from("user_actions")
      .select("*, action_types(*)")
      .eq("id", action_id)
      .single();

    if (!action) {
      return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // No Proof → No Score
    const { data: proofs } = await supabaseAdmin
      .from("proofs")
      .select("*")
      .eq("action_id", action_id);

    if (!proofs || proofs.length === 0) {
      return new Response(JSON.stringify({ error: "🚫 No Proof → No Score → No Mint" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === LAYER 1: AI Analysis (60%) ===
    const aiScores = await runAIValidation(action, proofs);

    // === LAYER 2: Community Feedback (20%) ===
    const { data: reviews } = await supabaseAdmin
      .from("community_reviews")
      .select("endorse_score, flag_score")
      .eq("action_id", action_id);

    const communityScores = calculateCommunityScores(reviews || []);

    // === LAYER 3: System Trust Signals (20%) ===
    const systemScores = await calculateSystemTrust(supabaseAdmin, action.user_id);

    // === COMBINE: Weighted average per pillar ===
    const serving_life = clamp(AI_WEIGHT * aiScores.serving + COMMUNITY_WEIGHT * communityScores.serving + SYSTEM_TRUST_WEIGHT * systemScores.serving);
    const transparent_truth = clamp(AI_WEIGHT * aiScores.truth + COMMUNITY_WEIGHT * communityScores.truth + SYSTEM_TRUST_WEIGHT * systemScores.truth);
    const healing_love = clamp(AI_WEIGHT * aiScores.love + COMMUNITY_WEIGHT * communityScores.love + SYSTEM_TRUST_WEIGHT * systemScores.love);
    const long_term_value = clamp(AI_WEIGHT * aiScores.value + COMMUNITY_WEIGHT * communityScores.value + SYSTEM_TRUST_WEIGHT * systemScores.value);
    const unity_over_separation = clamp(AI_WEIGHT * aiScores.unity + COMMUNITY_WEIGHT * communityScores.unity + SYSTEM_TRUST_WEIGHT * systemScores.unity);

    // === ZERO-KILL RULE ===
    const hasZero = serving_life === 0 || transparent_truth === 0 || healing_love === 0 || long_term_value === 0 || unity_over_separation === 0;
    const rawScore = hasZero ? 0 : (serving_life * transparent_truth * healing_love * long_term_value * unity_over_separation) / 10000;
    const finalScore = Math.round(rawScore * 100) / 100;

    // === SAFETY RULES ===
    let validationStatus = "validated";
    const flags: string[] = [];

    if (transparent_truth < 3) {
      validationStatus = "manual_review";
      flags.push("LOW_TRUTH_SCORE");
    }
    if (serving_life === 0) {
      validationStatus = "rejected";
      flags.push("ZERO_SERVING");
    }
    if (healing_love === 0) {
      validationStatus = "rejected";
      flags.push("ZERO_LOVE");
    }

    // Store validation
    const { data: validation, error: valErr } = await supabaseAdmin
      .from("pplp_validations")
      .insert({
        action_id,
        serving_life: round2(serving_life),
        transparent_truth: round2(transparent_truth),
        healing_love: round2(healing_love),
        long_term_value: round2(long_term_value),
        unity_over_separation: round2(unity_over_separation),
        ai_score: round2(aiScores.confidence),
        community_score: round2(communityScores.avgScore),
        trust_signal_score: round2(systemScores.trustLevel),
        final_light_score: finalScore,
        validation_status: validationStatus,
        explanation: { flags, aiScores, communityScores: communityScores.summary, systemTrust: systemScores.summary },
        validated_at: validationStatus !== "manual_review" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (valErr) {
      console.error("Validation insert error:", valErr);
      return new Response(JSON.stringify({ error: "Failed to store validation" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update action status
    const actionStatus = validationStatus === "rejected" ? "rejected" : validationStatus === "manual_review" ? "under_review" : "validated";
    await supabaseAdmin
      .from("user_actions")
      .update({ status: actionStatus })
      .eq("id", action_id);

    return new Response(JSON.stringify({
      action_id,
      validation_id: validation.id,
      validation_status: validationStatus,
      pplp_scores: {
        serving_life: round2(serving_life),
        transparent_truth: round2(transparent_truth),
        healing_love: round2(healing_love),
        long_term_value: round2(long_term_value),
        unity_over_separation: round2(unity_over_separation),
      },
      raw_light_score: rawScore,
      final_light_score: finalScore,
      flags,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// === AI VALIDATION ===
async function runAIValidation(action: any, proofs: any[]): Promise<{ serving: number; truth: number; love: number; value: number; unity: number; confidence: number }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fallback: heuristic scoring
    return heuristicScoring(action, proofs);
  }

  try {
    const prompt = `You are a PPLP (Proof of Pure Love Protocol) validator. Analyze this action and score it on 5 pillars (0-10 each).

Action: ${action.title}
Description: ${action.description || "N/A"}
Category: ${action.action_types?.name || "Unknown"}
Proof count: ${proofs.length}
Proof types: ${proofs.map((p: any) => p.proof_type).join(", ")}

Score each pillar 0-10:
1. Serving Life (phụng sự): Does this serve others/life?
2. Transparent Truth (chân thật): Is this authentic and transparent?
3. Healing & Love (chữa lành): Does this promote healing/love?
4. Long-term Value (giá trị): Does this create lasting value?
5. Unity (đoàn kết): Does this promote unity over separation?

Respond with ONLY a JSON object with tool call.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a PPLP Truth Validation Engine. Score actions honestly." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_pplp",
            description: "Score an action on 5 PPLP pillars",
            parameters: {
              type: "object",
              properties: {
                serving_life: { type: "number", minimum: 0, maximum: 10 },
                transparent_truth: { type: "number", minimum: 0, maximum: 10 },
                healing_love: { type: "number", minimum: 0, maximum: 10 },
                long_term_value: { type: "number", minimum: 0, maximum: 10 },
                unity: { type: "number", minimum: 0, maximum: 10 },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["serving_life", "transparent_truth", "healing_love", "long_term_value", "unity", "confidence"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_pplp" } },
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return heuristicScoring(action, proofs);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const scores = JSON.parse(toolCall.function.arguments);
      return {
        serving: clamp(scores.serving_life),
        truth: clamp(scores.transparent_truth),
        love: clamp(scores.healing_love),
        value: clamp(scores.long_term_value),
        unity: clamp(scores.unity),
        confidence: Math.max(0, Math.min(1, scores.confidence || 0.5)),
      };
    }

    return heuristicScoring(action, proofs);
  } catch (e) {
    console.error("AI validation error:", e);
    return heuristicScoring(action, proofs);
  }
}

function heuristicScoring(action: any, proofs: any[]) {
  const hasDescription = !!action.description && action.description.length > 20;
  const proofQuality = Math.min(10, proofs.length * 3 + (hasDescription ? 3 : 0));
  const base = Math.min(10, 4 + proofQuality * 0.4);
  return {
    serving: base,
    truth: hasDescription ? base : Math.max(3, base - 2),
    love: base * 0.9,
    value: base * 0.8,
    unity: base * 0.85,
    confidence: 0.5,
  };
}

// === COMMUNITY SCORING ===
function calculateCommunityScores(reviews: { endorse_score: number; flag_score: number }[]) {
  if (reviews.length === 0) {
    return { serving: 5, truth: 5, love: 5, value: 5, unity: 5, avgScore: 0, summary: "No community reviews" };
  }

  const totalEndorse = reviews.reduce((s, r) => s + (r.endorse_score || 0), 0);
  const totalFlag = reviews.reduce((s, r) => s + (r.flag_score || 0), 0);
  const netScore = Math.max(0, (totalEndorse - totalFlag) / reviews.length);
  const normalized = Math.min(10, netScore * 2);

  return {
    serving: normalized,
    truth: normalized,
    love: normalized,
    value: normalized,
    unity: normalized,
    avgScore: netScore,
    summary: `${reviews.length} reviews, net score: ${netScore.toFixed(1)}`,
  };
}

// === SYSTEM TRUST ===
async function calculateSystemTrust(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, banned, consistency_days")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { serving: 3, truth: 3, love: 3, value: 3, unity: 3, trustLevel: 0.3, summary: "No profile" };
  }

  if (profile.banned) {
    return { serving: 0, truth: 0, love: 0, value: 0, unity: 0, trustLevel: 0, summary: "Banned user" };
  }

  const ageDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
  const ageScore = Math.min(10, 3 + ageDays / 30);
  const consistencyScore = Math.min(10, 3 + (profile.consistency_days || 0) / 10);
  const trustLevel = Math.min(1.25, 1 + ageDays / 365 * 0.25);

  const base = (ageScore + consistencyScore) / 2;

  return {
    serving: base,
    truth: base,
    love: base,
    value: base,
    unity: base,
    trustLevel,
    summary: `Age: ${ageDays}d, consistency: ${profile.consistency_days || 0}d`,
  };
}

function clamp(v: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
