/**
 * pplp-learning-update — Self-Learning Loop for PPLP Engine v2.0
 * Phase 5: Adjusts model weights based on GOV corrections, anomaly patterns
 * Triggered weekly via pg_cron
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get current weights
    const { data: weights } = await supabase
      .from("pplp_model_weights")
      .select("*")
      .order("version", { ascending: false });

    if (!weights || weights.length === 0) {
      return new Response(JSON.stringify({ error: "No weights found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentVersion = Math.max(...weights.map(w => w.version));
    const currentWeights = Object.fromEntries(
      weights.filter(w => w.version === currentVersion).map(w => [w.dimension, w.weight])
    );

    // 2. Analyze recent validations for calibration signals
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentValidations } = await supabase
      .from("pplp_validations")
      .select("*")
      .gte("created_at", oneWeekAgo)
      .eq("validation_status", "validated");

    const { data: recentSubmissions } = await supabase
      .from("pplp_activity_submissions")
      .select("ai_analysis, fraud_score, proof_status")
      .gte("created_at", oneWeekAgo)
      .not("ai_analysis", "is", null);

    // 3. Calculate adjustment signals
    const validationCount = recentValidations?.length || 0;
    const submissionCount = recentSubmissions?.length || 0;

    // Average fraud score — if high, boost trust_factor weight
    const avgFraud = submissionCount > 0
      ? (recentSubmissions || []).reduce((s, r) => s + (r.fraud_score || 0), 0) / submissionCount
      : 0;

    // Average pillar scores from validations
    const avgPillars = validationCount > 0 ? {
      healing_love: (recentValidations || []).reduce((s, v) => s + v.healing_love, 0) / validationCount,
      serving_life: (recentValidations || []).reduce((s, v) => s + v.serving_life, 0) / validationCount,
      transparent_truth: (recentValidations || []).reduce((s, v) => s + v.transparent_truth, 0) / validationCount,
      unity: (recentValidations || []).reduce((s, v) => s + v.unity_over_separation, 0) / validationCount,
      long_term: (recentValidations || []).reduce((s, v) => s + v.long_term_value, 0) / validationCount,
    } : null;

    // 4. Apply learning adjustments (conservative: max ±5% per cycle)
    const MAX_ADJUSTMENT = 0.05;
    const newWeights: Record<string, number> = { ...currentWeights };

    // If fraud is high, increase trust_factor weight
    if (avgFraud > 0.3) {
      newWeights.trust = Math.min(1, (newWeights.trust || 0.2) * (1 + MAX_ADJUSTMENT));
      newWeights.intent = Math.max(0.05, (newWeights.intent || 0.25) * (1 - MAX_ADJUSTMENT * 0.5));
    }

    // If community impact is consistently high, boost impact weight
    if (avgPillars && avgPillars.serving_life > 7) {
      newWeights.impact = Math.min(1, (newWeights.impact || 0.2) * (1 + MAX_ADJUSTMENT * 0.5));
    }

    // If consistency patterns are weak, boost consistency weight to incentivize
    if (avgPillars && avgPillars.long_term < 3) {
      newWeights.consistency = Math.min(1, (newWeights.consistency || 0.15) * (1 + MAX_ADJUSTMENT));
    }

    // Normalize weights to sum to 1.0
    const totalWeight = Object.values(newWeights).reduce((s, w) => s + w, 0);
    for (const key of Object.keys(newWeights)) {
      newWeights[key] = Math.round((newWeights[key] / totalWeight) * 10000) / 10000;
    }

    // 5. Check if weights changed meaningfully
    const changed = Object.keys(newWeights).some(
      k => Math.abs((newWeights[k] || 0) - (currentWeights[k] || 0)) > 0.001
    );

    if (!changed) {
      return new Response(JSON.stringify({
        message: "No significant changes detected",
        version: currentVersion,
        validations_analyzed: validationCount,
        submissions_analyzed: submissionCount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Insert new version of weights
    const newVersion = currentVersion + 1;
    const dimensions = ['intent', 'depth', 'impact', 'consistency', 'trust'];
    const inserts = dimensions.map(dim => ({
      dimension: dim,
      weight: newWeights[dim] || 0.2,
      version: newVersion,
      updated_by: 'pplp-learning-update',
    }));

    const { error: insertError } = await supabase
      .from("pplp_model_weights")
      .insert(inserts);

    if (insertError) {
      console.error("Failed to insert new weights:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      old_version: currentVersion,
      new_version: newVersion,
      old_weights: currentWeights,
      new_weights: newWeights,
      signals: {
        validations_analyzed: validationCount,
        submissions_analyzed: submissionCount,
        avg_fraud: Math.round(avgFraud * 1000) / 1000,
        avg_pillars: avgPillars,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pplp-learning-update error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
